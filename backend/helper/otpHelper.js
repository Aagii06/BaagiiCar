const crypto = require("crypto");
const moment = require("moment");
const { emailOtps } = require("../models");
const { sendMail } = require("./mailHelper");

// Имэйлээр нэг удаагийн код илгээж, шалгах үйлчилгээ.
// purpose: кодыг юунд ашиглахыг ялгана ("login" гэх мэт) - нэг зорилгын код нөгөөд хүчингүй.
const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 10 * 60;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

const FORMAT = "YYYY-MM-DD HH:mm:ss";
const now = () => moment().utcOffset("+0800").format(FORMAT);
const parseAt = (value) => moment(value, FORMAT).utcOffset("+0800", true);
const secondsSince = (value) => (value ? moment().diff(parseAt(value), "seconds") : Infinity);

const hashOtp = (email, purpose, code) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET || "otp").update(`${purpose}:${email}:${code}`).digest("hex");
const newOtp = () => String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

const subjects = {
  login: "нэвтрэх код",
};

const otpEmailHtml = (code, title) => `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
  <p style="color:#888;font-size:13px;margin:0 0 8px">Baagii Car Dealer</p>
  <h2 style="margin:0 0 12px">${title}</h2>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:0 0 12px">${code}</p>
  <p style="color:#555;margin:0">Код ${OTP_TTL_SECONDS / 60} минутын турш хүчинтэй. Та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
</div>`;

// Код үүсгэж имэйлээр илгээнэ. Өмнөх код байвал хүчингүй болно.
// Буцаах: { success, message, data: { expires_in, resend_in } }
module.exports.sendEmailOtp = async (email, purpose) => {
  const existing = await emailOtps.findOne({ where: { email, purpose } });

  const wait = OTP_RESEND_SECONDS - secondsSince(existing?.sent_at);
  if (wait > 0)
    return { success: false, data: { resend_in: wait }, message: `${wait} секундын дараа дахин код авна уу` };

  const code = newOtp();
  const at = now();
  const values = {
    otp_hash: hashOtp(email, purpose, code),
    expires_at: parseAt(at).add(OTP_TTL_SECONDS, "seconds").format(FORMAT),
    sent_at: at,
    attempts: 0,
    updated_at: at,
  };

  const title = `Baagii Car Dealer ${subjects[purpose] || "баталгаажуулах код"}`;
  if (!process.env.MAIL_USER_NAME || !process.env.MAIL_USER_PASS) {
    if (process.env.NODE_ENV === "production") throw new Error("MAIL_USER_NAME / MAIL_USER_PASS тохируулаагүй");
    console.log(`[dev] ${email} (${purpose}) код: ${code}`);
  } else {
    const sent = await sendMail(email, { subject: `${title}: ${code}`, html: otpEmailHtml(code, title) });
    if (!sent) throw new Error("Имэйл хаяг буруу байна");
  }

  if (existing) await existing.update(values);
  else await emailOtps.create({ email, purpose, created_at: at, ...values });

  return {
    success: true,
    data: { expires_in: OTP_TTL_SECONDS, resend_in: OTP_RESEND_SECONDS },
    message: "Код имэйлээр илгээлээ",
  };
};

// Кодыг шалгана. Зөв бол кодыг устгана (дахин ашиглагдахгүй).
// Буцаах: { success, message }
module.exports.verifyEmailOtp = async (email, purpose, code) => {
  const invalid = (message) => ({ success: false, message });

  const row = await emailOtps.findOne({ where: { email, purpose } });
  if (!row) return invalid("Эхлээд код авна уу");
  if (row.attempts >= OTP_MAX_ATTEMPTS) return invalid("Оролдлого хэтэрлээ. Шинэ код авна уу");
  if (moment().isAfter(parseAt(row.expires_at))) return invalid("Кодын хугацаа дууссан. Шинэ код авна уу");

  const matches = crypto.timingSafeEqual(Buffer.from(hashOtp(email, purpose, code)), Buffer.from(row.otp_hash));
  if (!matches) {
    await row.increment("attempts");
    return invalid("Код буруу байна");
  }

  await row.destroy();
  return { success: true, message: "" };
};
