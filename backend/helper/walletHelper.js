const moment = require("moment");
const { sequelize, dealers, dealerTransactions, paymentSettings, op } = require("../models");

// Дилерийн данс. Үлдэгдлийг тусад нь хадгалахгүй: "done" гүйлгээний нийлбэр нь үлдэгдэл.
// Зарлага гаргахдаа дилерийн мөрийг түгжиж (FOR UPDATE) зэрэг хүсэлтээр хасах давхардлаас сэргийлнэ.

const now = () => moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
module.exports.now = now;

const toNumber = (v) => Number(v) || 0;
module.exports.toNumber = toNumber;

const balanceOf = async (dealerId, transaction) => {
  const sum = await dealerTransactions.sum("amount", { where: { dealer_id: dealerId, status: "done" }, transaction });
  return toNumber(sum);
};
module.exports.balanceOf = balanceOf;

// Бүх дилерийн үлдэгдэл { dealer_id: balance }
module.exports.balances = async () => {
  const rows = await dealerTransactions.findAll({
    attributes: ["dealer_id", [sequelize.fn("SUM", sequelize.col("amount")), "balance"]],
    where: { status: "done" },
    group: ["dealer_id"],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r.dealer_id, toNumber(r.balance)]));
};

// Ганц мөртэй тохиргоо (байхгүй бол null)
module.exports.getSettings = () => paymentSettings.findOne({ order: [["id", "asc"]] });

module.exports.renewPrice = async () => toNumber((await module.exports.getSettings())?.renew_price);

// Дилерийн мөрийг түгжээд үлдэгдэл хүрэлцвэл зарлага бичнэ. `work(t)` нь ижил гүйлгээн дотор
// ажиллах нэмэлт өөрчлөлт (зар шинэчлэх г.м.). Үлдэгдэл хүрэлцэхгүй бол алдааны мессеж шиднэ.
module.exports.charge = async ({ dealerId, amount, type, carId, note, by, at }, work) =>
  sequelize.transaction(async (t) => {
    const dealer = await dealers.findByPk(dealerId, { attributes: ["id"], transaction: t, lock: t.LOCK.UPDATE });
    if (!dealer) throw "Дилер олдсонгүй";
    const balance = await balanceOf(dealerId, t);
    if (balance < amount)
      throw `Дансны үлдэгдэл хүрэлцэхгүй байна (үлдэгдэл ₮${Math.round(balance).toLocaleString("en-US")}, шаардлагатай ₮${Math.round(amount).toLocaleString("en-US")})`;
    if (amount > 0)
      await dealerTransactions.create(
        { dealer_id: dealerId, type, method: "balance", amount: -amount, status: "done", car_id: carId, note, created_by: by, created_at: at },
        { transaction: t },
      );
    if (work) await work(t);
    return balance - amount;
  });

// Хүлээгдэж буй (дансаар шилжүүлсэн) гүйлгээг админ батлах / буцаах. Нэг удаа л шийднэ
module.exports.review = async ({ id, approve, reason, by, at }) => {
  const [changed] = await dealerTransactions.update(
    approve
      ? { status: "done", reviewed_by: by, reviewed_at: at }
      : { status: "rejected", reject_reason: reason || null, reviewed_by: by, reviewed_at: at },
    { where: { id, status: "pending" } },
  );
  return changed > 0;
};

module.exports.op = op;
