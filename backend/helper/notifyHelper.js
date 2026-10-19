const webpush = require("web-push");
const { subscriptions, vwCars } = require("../models");

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

/** Шинэ идэвхтэй зарын тухай push-д бүртгүүлсэн бүх хүнд тэр дор нь илгээнэ. Имэйлийг digestHelper тогтмол нэгтгэн илгээнэ. Алдаа шидэхгүй. */
module.exports.notifyNewCar = async (carId) => {
  try {
    const car = await vwCars.findOne({ where: { id: carId }, raw: true });
    if (!car || car.status !== "active") return;
    await sendPushes(car);
  } catch (error) {
    console.log("notifyNewCar failed:", error);
  }
};

module.exports.formatPrice = formatPrice;
module.exports.escapeHtml = escapeHtml;
module.exports.carTitle = carTitle;
module.exports.carSummary = carSummary;
