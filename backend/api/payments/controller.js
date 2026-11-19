const { users, dealers, cars, dealerTransactions, qpayInvoices, paymentSettings, op } = require("../../models");
const { roles, carRenewDays } = require("../../config/constants");
const { balanceOf, balances, getSettings, review, toNumber } = require("../../helper/walletHelper");
const { qpayReady, testQpay, createTopupInvoice, checkInvoice, toClient } = require("../../helper/qpayHelper");

// Дилерийн данс ба админы төлбөрийн тохиргоо.
// Дилер дансаа QPay (автоматаар) эсвэл дансаар шилжүүлж (админ баталгаажуулна) цэнэглээд,
// 7 хоног болоогүй зараа үлдэгдлээсээ renew_price төлж шинэчилнэ (api/cars renew).

const ok = (res, data, message = "Амжилттай") => res.status(200).json({ success: true, data, message });
const fail = (res, message) => res.status(200).json({ success: false, data: null, message });
const handle = (name, fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (error) {
    console.log(`${name}Error:`, error);
    return fail(res, typeof error === "string" ? error : "Алдаа");
  }
};

const isAdmin = (req) => req.loggedUser?.role === roles.admin;
const str = (v) => (typeof v === "string" ? v.trim() : "");
// Цэнэглэх дүнгийн хязгаар
const MIN_TOPUP = 100;
const MAX_TOPUP = 100000000;

// Нэвтэрсэн хэрэглэгчийн дилер (токен хуучин байж болох тул баазаас уншина)
const dealerIdOf = async (loggedUser) => {
  if (!loggedUser?.id) return null;
  const user = await users.findByPk(loggedUser.id, { attributes: ["dealer_id", "phonenumber"], raw: true });
  return user?.dealer_id || null;
};

// Дилерийн хэрэглэгч л дансаа цэнэглэнэ
const requireDealer = async (req) => {
  if (req.loggedUser?.role !== roles.dealer) throw "Зөвхөн дилер дансаа цэнэглэнэ";
  const dealerId = await dealerIdOf(req.loggedUser);
  if (!dealerId) throw "Та дилерт харьяалагдаагүй байна. Админд хандана уу";
  return dealerId;
};

const toBank = (s) =>
  s?.bank_enabled
    ? { bank_name: s.bank_name, account_name: s.bank_account_name, account_number: s.bank_account_number, iban: s.bank_iban }
    : null;

// Админ самбарын дилерийн "Миний данс" ба шинэчлэх товчинд: үнэ, төлөх аргууд, үлдэгдэл
module.exports.info = handle("paymentInfo", async (req, res) => {
  const s = await getSettings();
  const dealerId = isAdmin(req) ? null : await dealerIdOf(req.loggedUser);
  return ok(res, {
    renew_price: toNumber(s?.renew_price),
    renew_days: carRenewDays,
    bank: toBank(s),
    qpay: qpayReady(s),
    dealer_id: dealerId,
    balance: dealerId ? await balanceOf(dealerId) : null,
  });
});

// Админы төлбөрийн тохиргоо. QPay-ийн нууц үгийг буцаахгүй — хоосон илгээвэл хуучнаараа үлдэнэ
const toAdmin = (s) => ({
  renew_price: toNumber(s?.renew_price),
  bank: {
    enabled: Boolean(s?.bank_enabled),
    bank_name: s?.bank_name ?? "",
    account_name: s?.bank_account_name ?? "",
    account_number: s?.bank_account_number ?? "",
    iban: s?.bank_iban ?? "",
  },
  qpay: {
    enabled: Boolean(s?.qpay_enabled),
    sandbox: s ? Boolean(s.qpay_sandbox) : true,
    username: s?.qpay_username ?? "",
    has_password: Boolean(s?.qpay_password),
    invoice_code: s?.qpay_invoice_code ?? "",
  },
});

module.exports.getSettings = handle("paymentSettings", async (req, res) => {
  if (!isAdmin(req)) return fail(res, "Танд энэ үйлдлийг хийх эрх байхгүй");
  return ok(res, toAdmin(await getSettings()));
});

module.exports.saveSettings = handle("savePaymentSettings", async (req, res) => {
  if (!isAdmin(req)) return fail(res, "Танд энэ үйлдлийг хийх эрх байхгүй");
  const { renew_price, bank = {}, qpay = {}, by, at } = req.body;
  const price = Number(renew_price);
  if (!Number.isInteger(price) || price < 0) return fail(res, "Шинэчлэлийн үнэ 0-ээс багагүй бүхэл тоо байна");

  const existing = await getSettings();
  const values = {
    renew_price: price,
    bank_enabled: Boolean(bank.enabled),
    bank_name: str(bank.bank_name) || null,
    bank_account_name: str(bank.account_name) || null,
    bank_account_number: str(bank.account_number) || null,
    bank_iban: str(bank.iban) || null,
    qpay_enabled: Boolean(qpay.enabled),
    qpay_sandbox: qpay.sandbox !== false,
    qpay_username: str(qpay.username) || null,
    qpay_password: str(qpay.password) || existing?.qpay_password || null,
    qpay_invoice_code: str(qpay.invoice_code) || null,
    updated_by: by,
    updated_at: at,
  };
  if (values.bank_enabled && !(values.bank_name && values.bank_account_name && values.bank_account_number))
    return fail(res, "Банк, хүлээн авагч, дансны дугаарыг оруулна уу");
  if (values.qpay_enabled && !(values.qpay_username && values.qpay_password && values.qpay_invoice_code))
    return fail(res, "QPay-ийн нэвтрэх нэр, нууц үг, нэхэмжлэхийн кодыг оруулна уу");
  if (values.qpay_enabled) {
    try {
      await testQpay(values);
    } catch (error) {
      return fail(res, `QPay-д холбогдож чадсангүй: ${typeof error === "string" ? error : "сүлжээний алдаа"}`);
    }
  }
  const saved = existing ? await existing.update(values) : await paymentSettings.create({ ...values, created_at: at });
  return ok(res, toAdmin(saved), "Хадгаллаа");
});

// Гүйлгээний жагсаалт: дилер өөрийнхөө, админ бүгдийг (?dealer_id, ?status шүүлттэй)
module.exports.transactions = handle("dealerTransactions", async (req, res) => {
  const where = {};
  if (isAdmin(req)) {
    if (req.query.dealer_id) where.dealer_id = Number(req.query.dealer_id);
  } else {
    const dealerId = await dealerIdOf(req.loggedUser);
    if (!dealerId) return ok(res, { rows: [], count: 0 });
    where.dealer_id = dealerId;
  }
  if (["pending", "done", "rejected"].includes(req.query.status)) where.status = req.query.status;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const { rows, count } = await dealerTransactions.findAndCountAll({ where, order: [["id", "desc"]], limit, offset, raw: true });
  const dealerIds = [...new Set(rows.map((r) => r.dealer_id))];
  const carIds = [...new Set(rows.map((r) => r.car_id).filter(Boolean))];
  const userIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))];
  const [dealerRows, carRows, userRows] = await Promise.all([
    dealers.findAll({ where: { id: dealerIds }, attributes: ["id", "name", "logo"], raw: true }),
    carIds.length ? cars.findAll({ where: { id: carIds }, attributes: ["id", "code"], raw: true }) : [],
    userIds.length ? users.findAll({ where: { id: userIds }, attributes: ["id", "firstname", "lastname", "phonenumber"], raw: true }) : [],
  ]);
  const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  const d = byId(dealerRows), c = byId(carRows), u = byId(userRows);
  return ok(res, {
    count,
    rows: rows.map((r) => ({
      ...r,
      amount: toNumber(r.amount),
      dealer_name: d[r.dealer_id]?.name ?? null,
      dealer_logo: d[r.dealer_id]?.logo ?? null,
      car_code: c[r.car_id]?.code ?? null,
      created_by_name: u[r.created_by] ? [u[r.created_by].firstname, u[r.created_by].phonenumber].filter(Boolean).join(" · ") : null,
    })),
  });
});

// Админд: дилер бүрийн үлдэгдэл ба хүлээгдэж буй хүсэлтийн тоо
module.exports.balances = handle("dealerBalances", async (req, res) => {
  if (!isAdmin(req)) return fail(res, "Танд энэ үйлдлийг хийх эрх байхгүй");
  const [rows, sums, pending] = await Promise.all([
    dealers.findAll({ where: { deleted_at: null }, attributes: ["id", "name", "logo", "status"], order: [["name", "asc"]], raw: true }),
    balances(),
    dealerTransactions.count({ where: { status: "pending" }, group: ["dealer_id"] }),
  ]);
  const pendingBy = Object.fromEntries(pending.map((p) => [p.dealer_id, p.count]));
  return ok(
    res,
    rows.map((r) => ({
      ...r,
      balance: sums[r.id]?.balance ?? 0,
      total_in: sums[r.id]?.total_in ?? 0,
      total_out: sums[r.id]?.total_out ?? 0,
      pending: pendingBy[r.id] ?? 0,
    })),
  );
});

const parseAmount = (v) => {
  const amount = Number(v);
  if (!Number.isInteger(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP)
    throw `Дүн ₮${MIN_TOPUP}-аас ₮${MAX_TOPUP.toLocaleString("en-US")}-ийн хооронд бүхэл тоо байна`;
  return amount;
};

// Дансаа QPay-ээр цэнэглэх нэхэмжлэх: дилер өөрийнхөө, админ dealer_id-аар аль ч дилерийнх
module.exports.topupQpay = handle("topupQpay", async (req, res) => {
  const amount = parseAmount(req.body.amount);
  let dealerId, phone;
  if (isAdmin(req)) {
    const dealer = await dealers.findByPk(Number(req.body.dealer_id), { attributes: ["id", "phonenumber", "status"], raw: true });
    if (!dealer || dealer.status === "deleted") return fail(res, "Дилер олдсонгүй");
    dealerId = dealer.id;
    phone = dealer.phonenumber;
  } else {
    dealerId = await requireDealer(req);
    phone = (await users.findByPk(req.loggedUser.id, { attributes: ["phonenumber"], raw: true }))?.phonenumber;
  }
  const invoice = await createTopupInvoice({ dealerId, amount, by: req.body.by, phone });
  return ok(res, toClient(invoice));
});

// Нэхэмжлэх төлөгдсөн эсэх (админ самбар хэдэн секунд тутам асууна)
module.exports.checkQpay = handle("checkQpay", async (req, res) => {
  const invoice = await qpayInvoices.findByPk(Number(req.body.id));
  if (!invoice) return fail(res, "Нэхэмжлэх олдсонгүй");
  if (!isAdmin(req) && invoice.dealer_id !== (await dealerIdOf(req.loggedUser))) return fail(res, "Нэхэмжлэх олдсонгүй");
  const checked = await checkInvoice(invoice);
  return ok(res, { paid: checked.status === "paid", balance: await balanceOf(invoice.dealer_id) });
});

// Дилер дансаар шилжүүлснээ мэдэгдэнэ — админ баталгаажуулахад дансанд орно
module.exports.topupBank = handle("topupBank", async (req, res) => {
  const dealerId = await requireDealer(req);
  const amount = parseAmount(req.body.amount);
  const s = await getSettings();
  if (!s?.bank_enabled) return fail(res, "Дансаар шилжүүлэх боломжгүй байна");
  const pending = await dealerTransactions.count({ where: { dealer_id: dealerId, status: "pending" } });
  if (pending >= 5) return fail(res, "Хүлээгдэж буй хүсэлт олон байна. Админ шалгахыг хүлээнэ үү");
  const row = await dealerTransactions.create({
    dealer_id: dealerId,
    type: "topup",
    method: "bank",
    amount,
    status: "pending",
    note: str(req.body.note).slice(0, 500) || null,
    created_by: req.body.by,
    created_at: req.body.at,
  });
  return ok(res, row, "Хүсэлт илгээлээ. Админ шалгаад дансанд тань орно");
});

// Админ дансаар шилжүүлсэн хүсэлтийг батлах / буцаах
module.exports.approve = handle("approveTopup", async (req, res) => {
  if (!isAdmin(req)) return fail(res, "Танд энэ үйлдлийг хийх эрх байхгүй");
  const done = await review({ id: Number(req.body.id), approve: true, by: req.body.by, at: req.body.at });
  if (!done) return fail(res, "Хүсэлт олдсонгүй эсвэл шийдэгдсэн байна");
  return ok(res, { id: Number(req.body.id) }, "Баталгаажууллаа, дилерийн дансанд орлоо");
});

module.exports.reject = handle("rejectTopup", async (req, res) => {
  if (!isAdmin(req)) return fail(res, "Танд энэ үйлдлийг хийх эрх байхгүй");
  const reason = str(req.body.reason).slice(0, 500);
  if (!reason) return fail(res, "Буцаах шалтгаанаа бичнэ үү");
  const done = await review({ id: Number(req.body.id), approve: false, reason, by: req.body.by, at: req.body.at });
  if (!done) return fail(res, "Хүсэлт олдсонгүй эсвэл шийдэгдсэн байна");
  return ok(res, { id: Number(req.body.id) }, "Буцаалаа");
});

// Админ дилерийн дансыг гараар нэмэх / хасах (бэлнээр авсан, буцаан олголт г.м.)
module.exports.adjust = handle("adjustBalance", async (req, res) => {
  if (!isAdmin(req)) return fail(res, "Танд энэ үйлдлийг хийх эрх байхгүй");
  const dealerId = Number(req.body.dealer_id);
  const amount = Number(req.body.amount);
  const note = str(req.body.note).slice(0, 500);
  if (!(await dealers.findByPk(dealerId, { attributes: ["id"] }))) return fail(res, "Дилер олдсонгүй");
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > MAX_TOPUP) return fail(res, "Дүн буруу байна");
  if (!note) return fail(res, "Тайлбар бичнэ үү");
  if (amount < 0 && (await balanceOf(dealerId)) + amount < 0) return fail(res, "Үлдэгдлээс их дүн хасах боломжгүй");
  await dealerTransactions.create({
    dealer_id: dealerId,
    type: "adjust",
    method: "admin",
    amount,
    status: "done",
    note,
    created_by: req.body.by,
    created_at: req.body.at,
    reviewed_by: req.body.by,
    reviewed_at: req.body.at,
  });
  return ok(res, { balance: await balanceOf(dealerId) }, "Хадгаллаа");
});

// QPay төлбөр орсны дараа callback_url-г дуудна (нэвтрэлтгүй). Илгээсэн өгөгдөлд итгэхгүй —
// нэхэмжлэхийг QPay-ээс өөрөөс нь шалгаж тэмдэглэнэ
module.exports.qpayCallback = async (req, res) => {
  try {
    const invoice = await qpayInvoices.findOne({ where: { sender_invoice_no: String(req.params.no) } });
    if (invoice) await checkInvoice(invoice);
  } catch (error) {
    console.log("qpayCallbackError:", error);
  }
  return res.status(200).json({ success: true });
};

module.exports.op = op;
