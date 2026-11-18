const crypto = require("crypto");
const { qpayInvoices, dealerTransactions } = require("../models");
const { now, toNumber, getSettings } = require("./walletHelper");

// QPay merchant API v2. Тохиргоо нь paymentSettings-д (админ самбарын "Төлбөрийн тохиргоо").
// Дилер дансаа цэнэглэхэд нэхэмжлэх үүсгээд QR / банкны аппын холбоосыг өгнө; төлөгдсөнийг
// payment/check-ээр (админ самбарын polling эсвэл QPay-ийн callback) шалгаж дансанд орлого бичнэ.
const baseUrl = (s) => (s.qpay_sandbox ? "https://merchant-sandbox.qpay.mn" : "https://merchant.qpay.mn");

// { key, token, expiresAt }. Нэвтрэх мэдээлэл солигдвол key зөрж дахин авна
let cachedToken = null;

const qpayFetch = async (url, options) => {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    console.log("qpayError:", res.status, url, text);
    throw `QPay: ${data.message || data.error || res.status}`;
  }
  return data;
};

const getToken = async (s) => {
  const key = `${baseUrl(s)}|${s.qpay_username}|${s.qpay_password}`;
  if (cachedToken?.key === key && cachedToken.expiresAt > Date.now() + 60 * 1000) return cachedToken.token;
  const data = await qpayFetch(`${baseUrl(s)}/v2/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${s.qpay_username}:${s.qpay_password}`).toString("base64")}` },
  });
  // expires_in нь unix секунд (заримдаа үлдсэн секунд) — аль нь ч байсан 50 минутаас хэтрүүлэхгүй
  const exp = Number(data.expires_in) || 0;
  const expiresAt = Math.min(exp > 1e9 ? exp * 1000 : Date.now() + exp * 1000, Date.now() + 50 * 60 * 1000);
  cachedToken = { key, token: data.access_token, expiresAt };
  return data.access_token;
};

const authed = async (s, path, body) =>
  qpayFetch(`${baseUrl(s)}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getToken(s)}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const qpayReady = (s) => Boolean(s?.qpay_enabled && s.qpay_username && s.qpay_password && s.qpay_invoice_code);
module.exports.qpayReady = qpayReady;

// Админ хадгалахад: нэвтрэх мэдээлэл зөв эсэх
module.exports.testQpay = async (s) => {
  cachedToken = null;
  await getToken(s);
};

const toClient = (invoice) => ({
  id: invoice.id,
  amount: toNumber(invoice.amount),
  qr_text: invoice.qr_text,
  qr_image: invoice.qr_image,
  short_url: invoice.short_url,
  urls: invoice.urls ? JSON.parse(invoice.urls) : [],
  paid: invoice.status === "paid",
});
module.exports.toClient = toClient;

// Дилерийн дансыг цэнэглэх нэхэмжлэх: ижил дүнтэй төлөгдөөгүй нэхэмжлэх байвал түүнийг дахин ашиглана
module.exports.createTopupInvoice = async ({ dealerId, amount, by, phone }) => {
  const s = await getSettings();
  if (!qpayReady(s)) throw "QPay-ээр төлөх боломжгүй байна";

  const existing = await qpayInvoices.findOne({
    where: { dealer_id: dealerId, status: "pending", amount },
    order: [["id", "desc"]],
  });
  // QPay-ийн нэхэмжлэх 24 цагийн дотор хүчинтэй гэж үзнэ
  if (existing && Date.now() - new Date(existing.created_at.replace(" ", "T") + "+08:00").getTime() < 20 * 60 * 60 * 1000)
    return existing;

  const senderInvoiceNo = `D${dealerId}-${crypto.randomBytes(8).toString("hex")}`;
  const publicUrl = (process.env.API_URL || `http://localhost:${process.env.PORT || 5011}`).replace(/\/$/, "");
  const data = await authed(s, "/v2/invoice", {
    invoice_code: s.qpay_invoice_code,
    sender_invoice_no: senderInvoiceNo,
    invoice_receiver_code: phone || "terminal",
    invoice_description: `Дилерийн данс цэнэглэх #${dealerId}`,
    amount,
    callback_url: `${publicUrl}/web/qpay/callback/${senderInvoiceNo}`,
  });
  const at = now();
  return qpayInvoices.create({
    dealer_id: dealerId,
    sender_invoice_no: senderInvoiceNo,
    invoice_id: data.invoice_id,
    amount,
    status: "pending",
    qr_text: data.qr_text,
    qr_image: data.qr_image,
    short_url: data.qPay_shortUrl,
    urls: JSON.stringify((data.urls ?? []).map(({ name, description, logo, link }) => ({ name, description, logo, link }))),
    created_by: by,
    created_at: at,
    updated_at: at,
  });
};

// QPay-ээс төлөгдсөн эсэхийг асууж, төлөгдсөн бол нэхэмжлэхийг тэмдэглээд дансанд орлого бичнэ
const checkInvoice = async (invoice) => {
  if (invoice.status === "paid") return invoice;
  const s = await getSettings();
  if (!qpayReady(s)) return invoice;
  const data = await authed(s, "/v2/payment/check", {
    object_type: "INVOICE",
    object_id: invoice.invoice_id,
    offset: { page_number: 1, page_limit: 100 },
  });
  const paid = (data.rows ?? []).filter((r) => r.payment_status === "PAID");
  const paidAmount = paid.reduce((sum, r) => sum + toNumber(r.payment_amount), 0);
  if (paid.length === 0 || paidAmount < toNumber(invoice.amount)) return invoice;

  const at = now();
  // Зөвхөн анх төлөгдсөнийг тэмдэглэсэн хүсэлт л орлого бичнэ (polling, callback зэрэг ирж болно)
  const [changed] = await qpayInvoices.update(
    { status: "paid", payment_id: String(paid[0].payment_id), paid_at: at, updated_at: at },
    { where: { id: invoice.id, status: "pending" } },
  );
  if (changed > 0)
    await dealerTransactions.create({
      dealer_id: invoice.dealer_id,
      type: "topup",
      method: "qpay",
      amount: invoice.amount,
      status: "done",
      qpay_invoice_id: invoice.id,
      created_by: invoice.created_by,
      created_at: at,
    });
  return invoice.reload();
};
module.exports.checkInvoice = checkInvoice;
