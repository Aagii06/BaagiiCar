const schedule = require("node-schedule");
const moment = require("moment");
const { subscriptions, vwCars, op } = require("../models");
const { sendMail } = require("./mailHelper");
const { formatPrice, escapeHtml, carTitle, carSummary } = require("./notifyHelper");

// Имэйлээр бүртгүүлсэн хүмүүст өмнө нь илгээгээгүй шинэ заруудыг нэгтгэн илгээнэ.
// Өдөр бүр DIGEST_HOUR цагт шалгаад, сүүлд илгээснээс хойш DIGEST_INTERVAL_DAYS өдөр өнгөрсөн хүмүүст явуулна.
const MAX_CARS = 20;

const webUrl = () => (process.env.WEB_URL || "http://localhost:3880").replace(/\/$/, "");
const apiUrl = () => (process.env.API_URL || "").replace(/\/$/, "");
const intervalDays = () => Math.max(1, Number(process.env.DIGEST_INTERVAL_DAYS) || 1);
const digestHour = () => {
  const hour = Number(process.env.DIGEST_HOUR);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 10;
};
const now = () => moment().utcOffset("+0800");

const carRow = (car) => {
  const link = `${webUrl()}/cars/${car.id}`;
  // Зураг зөвхөн backend-ийн нийтийн хаяг (API_URL) тохируулсан үед — localhost-ыг имэйлийн програм ачаалж чадахгүй
  const image =
    apiUrl() && car.image
      ? `<td width="96" style="padding:12px 12px 12px 0;vertical-align:top"><a href="${link}"><img src="${apiUrl()}/uploads/cars/thumb_${encodeURIComponent(car.image)}" width="96" alt="" style="display:block;border-radius:8px"></a></td>`
      : "";
  return `
  <tr style="border-bottom:1px solid #eee">
    ${image}
    <td style="padding:12px 0;vertical-align:top">
      <a href="${link}" style="color:#111;font-weight:bold;font-size:15px;text-decoration:none">${escapeHtml(carTitle(car))} ${escapeHtml(car.manufactured_year || "")}</a>
      <div style="color:#f05a28;font-weight:bold;margin:4px 0">${escapeHtml(formatPrice(car.price))}</div>
      <div style="color:#666;font-size:13px">${escapeHtml(carSummary(car))}</div>
    </td>
  </tr>`;
};

const digestHtml = (rows, total, unsubscribeLink) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
  <p style="color:#888;font-size:13px;margin:0 0 8px">Baagii Car Dealer</p>
  <h2 style="margin:0 0 4px">Шинэ зар: ${total}</h2>
  <p style="color:#555;margin:0 0 12px">Таны сүүлд авсан имэйлээс хойш орсон зарууд.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows.map(carRow).join("")}</table>
  ${total > rows.length ? `<p style="margin:16px 0 0;color:#555">Мөн өөр ${total - rows.length} зар орсон.</p>` : ""}
  <a href="${webUrl()}/cars" style="display:inline-block;margin-top:20px;background:#f05a28;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">Бүх зарыг үзэх</a>
  <p style="color:#999;font-size:12px;margin-top:28px">
    Та Baagii Car Dealer-ийн шинэ зарын имэйлд бүртгүүлсэн тул энэ имэйлийг хүлээн авлаа.
    <a href="${unsubscribeLink}" style="color:#999">Бүртгэлээс гарах</a>
  </p>
</div>`;

const sendDigest = async (row) => {
  const where = { id: { [op.gt]: row.last_car_id || 0 }, status: "active" };
  const total = await vwCars.count({ where });
  if (!total) return false;

  const rows = await vwCars.findAll({ where, order: [["id", "DESC"]], limit: MAX_CARS, raw: true });
  const lastCarId = await vwCars.max("id", { where });
  const unsubscribeLink = `${webUrl()}/unsubscribe?token=${row.token}`;

  await sendMail(row.email, {
    subject: `Шинэ ${total} зар — Baagii Car Dealer`,
    html: digestHtml(rows, total, unsubscribeLink),
    headers: { "List-Unsubscribe": `<${unsubscribeLink}>` },
  });

  const at = now().format("YYYY-MM-DD HH:mm:ss");
  await subscriptions.update({ last_car_id: lastCarId, last_sent_at: at, updated_at: at }, { where: { id: row.id } });
  return true;
};

/** Хугацаа нь болсон бүх имэйл бүртгэлд digest илгээнэ. Алдаа шидэхгүй. */
module.exports.runDigest = async () => {
  if (!process.env.MAIL_USER_NAME || !process.env.MAIL_USER_PASS)
    return console.log("digest skipped: MAIL_USER_NAME / MAIL_USER_PASS are not set");

  // Цагийн зөрүүнээс болж нэг өдөр алгасахгүйн тулд өдрөөр нь харьцуулна
  const dueBefore = now().startOf("day").subtract(intervalDays() - 1, "days").format("YYYY-MM-DD HH:mm:ss");
  try {
    const rows = await subscriptions.findAll({
      where: {
        kind: "email",
        status: "active",
        [op.or]: [{ last_sent_at: null }, { last_sent_at: { [op.lt]: dueBefore } }],
      },
      raw: true,
    });

    let sent = 0;
    for (const row of rows) {
      try {
        if (await sendDigest(row)) sent++;
      } catch (error) {
        console.log("digest email failed:", row.email, error?.message);
      }
    }
    console.log(`digest: ${sent}/${rows.length} sent`);
  } catch (error) {
    console.log("runDigest failed:", error);
  }
};

module.exports.scheduleDigest = () => {
  const rule = new schedule.RecurrenceRule();
  rule.hour = digestHour();
  rule.minute = 0;
  rule.tz = "Asia/Ulaanbaatar";
  schedule.scheduleJob(rule, module.exports.runDigest);
  console.log(`digest scheduled: every ${intervalDays()} day(s) at ${digestHour()}:00 Asia/Ulaanbaatar`);
};
