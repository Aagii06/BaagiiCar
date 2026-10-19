const webpush = require("web-push");
const { subscriptions, vwCars } = require("../models");
const { sendMail } = require("./mailHelper");

const webUrl = () => (process.env.WEB_URL || "http://localhost:3880").replace(/\/$/, "");

const pushReady = () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:admin@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  return true;
};

const formatPrice = (price) => {
  const n = Math.round(Number(price) || 0);
  return n ? `${n.toLocaleString("en-US")}₮` : "Үнэ тохирно";
};

const escapeHtml = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const carTitle = (car) => [car.brand_name, car.model_name].filter(Boolean).join(" ") || car.name || "Машин";

const carSummary = (car) =>
  [
    car.manufactured_year,
    car.mileage != null && `${Number(car.mileage).toLocaleString("en-US")} км`,
    car.fuel_type,
    car.transmission,
    car.location_name,
  ]
    .filter(Boolean)
    .join(" · ");

const emailHtml = (car, link, unsubscribeLink) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
  <p style="color:#888;font-size:13px;margin:0 0 8px">Baagii Car Dealer — шинэ зар</p>
  <h2 style="margin:0 0 6px">${escapeHtml(carTitle(car))} ${escapeHtml(car.manufactured_year || "")}</h2>
  <p style="font-size:20px;font-weight:bold;color:#f05a28;margin:0 0 6px">${escapeHtml(formatPrice(car.price))}</p>
  <p style="color:#555;margin:0 0 20px">${escapeHtml(carSummary(car))}</p>
  <a href="${link}" style="display:inline-block;background:#f05a28;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">Зарыг үзэх</a>
  <p style="color:#999;font-size:12px;margin-top:28px">
    Та Baagii Car Dealer-ийн шинэ зарын мэдэгдэлд бүртгүүлсэн тул энэ имэйлийг хүлээн авлаа.
    <a href="${unsubscribeLink}" style="color:#999">Бүртгэлээс гарах</a>
  </p>
</div>`;

const sendEmails = async (car) => {
  const rows = await subscriptions.findAll({ where: { kind: "email", status: "active" }, raw: true });
  const link = `${webUrl()}/cars/${car.id}`;
  for (const row of rows) {
    const unsubscribeLink = `${webUrl()}/unsubscribe?token=${row.token}`;
    try {
      // Хүлээн авагч бүрт тусад нь — бусдын хаягийг харуулахгүйн тулд
      await sendMail(row.email, {
        subject: `Шинэ зар: ${carTitle(car)} ${car.manufactured_year || ""} — ${formatPrice(car.price)}`,
        html: emailHtml(car, link, unsubscribeLink),
        headers: { "List-Unsubscribe": `<${unsubscribeLink}>` },
      });
    } catch (error) {
      console.log("notify email failed:", row.email, error?.message);
    }
  }
};

const sendPushes = async (car) => {
  if (!pushReady()) return console.log("notify push skipped: VAPID keys are not set");
  const rows = await subscriptions.findAll({ where: { kind: "push", status: "active" }, raw: true });
  const payload = JSON.stringify({
    title: `Шинэ зар: ${carTitle(car)} ${car.manufactured_year || ""}`.trim(),
    body: [formatPrice(car.price), carSummary(car)].filter(Boolean).join(" · "),
    url: `/cars/${car.id}`,
  });
  for (const row of rows) {
    try {
      await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload);
    } catch (error) {
      // 404/410: хэрэглэгч мэдэгдлээ унтраасан эсвэл хөтөч subscription-ийг устгасан
      if (error?.statusCode === 404 || error?.statusCode === 410)
        await subscriptions.update({ status: "expired" }, { where: { id: row.id } });
      else console.log("notify push failed:", row.id, error?.statusCode, error?.body);
    }
  }
};

/** Шинэ идэвхтэй зарын тухай бүх бүртгэлтэй хүмүүст имэйл + push илгээнэ. Алдаа шидэхгүй. */
module.exports.notifyNewCar = async (carId) => {
  try {
    const car = await vwCars.findOne({ where: { id: carId }, raw: true });
    if (!car || car.status !== "active") return;
    await Promise.all([sendEmails(car), sendPushes(car)]);
  } catch (error) {
    console.log("notifyNewCar failed:", error);
  }
};
