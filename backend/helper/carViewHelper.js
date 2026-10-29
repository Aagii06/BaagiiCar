const moment = require("moment");
const { carViews, cars, sequelize, op } = require("../models");
const { readToken } = require("../middleware/auth");

// Нэг хүн нэг зарыг энэ хугацаанд дахин үзэхэд тоологдохгүй
const WINDOW_HOURS = 6;
// Хуучин мөрийг хүсэлт бүрт биш, 10 минутад нэг устгана
const CLEANUP_MS = 10 * 60 * 1000;
let lastCleanup = 0;

const format = (m) => m.utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");

// Proxy (nginx) ард бол X-Forwarded-For-ийн эхний хаяг жинхэнэ хэрэглэгчийнх
const clientIp = (req) =>
  (req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "").trim().slice(0, 45) || null;

/**
 * Зар (type "view") эсвэл утасны дугаар (type "phone") үзсэнийг тоолно.
 * Нэвтэрсэн бол customer_id-аар, нэвтрээгүй бол IP-гаар; 6 цагийн дотор өмнө нь тоологдсон бол refresh гэж үзээд тоолохгүй.
 * Тоолсон бол true.
 */
module.exports.countCarView = async (req, carId, type) => {
  const user = readToken(req);
  const customerId = user?.customer ? user.id : null;
  const ip = clientIp(req);
  const now = moment();
  const since = format(now.clone().subtract(WINDOW_HOURS, "hours"));

  if (Date.now() - lastCleanup > CLEANUP_MS) {
    lastCleanup = Date.now();
    carViews.destroy({ where: { created_at: { [op.lt]: since } } }).catch(console.log);
  }

  // Нэвтэрсэн бол зөвхөн өөрийнх нь бүртгэл: нэг IP-аас өөр customer орвол тоологдоно
  const who = customerId ? { customer_id: customerId } : ip ? { customer_id: null, ip } : null;
  if (!who) return false;

  const seen = await carViews.findOne({
    where: { car_id: carId, type, created_at: { [op.gte]: since }, ...who },
    attributes: ["id"],
  });
  if (seen) return false;

  await carViews.create({ car_id: carId, customer_id: customerId, ip, type, created_at: format(now) });
  const column = type === "phone" ? "phone_view_count" : "view_count";
  await cars.increment(column, { where: { id: carId } });
  // Өдрийн тоо (Самбарын "Өнөөдөр хамгийн их ..."): өдөрт нэг мөр, байвал нэмнэ
  await sequelize.query(
    `INSERT INTO carDailyStats (car_id, date, ${column}) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE ${column} = ${column} + 1`,
    { replacements: [carId, now.clone().utcOffset("+0800").format("YYYY-MM-DD")] },
  );
  return true;
};
