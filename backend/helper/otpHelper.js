const crypto = require("crypto");
const moment = require("moment");
const { emailOtps, phoneOtps } = require("../models");
const { sendMail } = require("./mailHelper");
const { isSmsConfigured, sendSms } = require("./smsHelper");

// Имэйл / утсаар (SMS) нэг удаагийн код илгээж, шалгах үйлчилгээ.
// purpose: кодыг юунд ашиглахыг ялгана ("login" гэх мэт) - нэг зорилгын код нөгөөд хүчингүй.
const EMAIL_OTP_LENGTH = 6;
const PHONE_OTP_LENGTH = 4;
const OTP_TTL_SECONDS = 10 * 60;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

const FORMAT = "YYYY-MM-DD HH:mm:ss";
const now = () => moment().utcOffset("+0800").format(FORMAT);
const parseAt = (value) => moment(value, FORMAT).utcOffset("+0800", true);
const secondsSince = (value) => (value ? moment().diff(parseAt(value), "seconds") : Infinity);

const hashOtp = (key, code) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET || "otp").update(`${key}:${code}`).digest("hex");
const newOtp = (length) => String(crypto.randomInt(0, 10 ** length)).padStart(length, "0");

// SMS холбогдоогүй үед бүх дугаарт ажиллах тогтмол код (.env: OTP_DEV_CODE)
const phoneDevCode = () => process.env.OTP_DEV_CODE || "2222";

// Код deliver(code)-оор илгээгээд hash-ийг хадгална. Өмнөх код байвал хүчингүй болно.
// Буцаах: { success, message, data: { expires_in, resend_in } }
const sendOtp = async ({ model, where, key, code, deliver, message }) => {
  const existing = await model.findOne({ where });

  const wait = OTP_RESEND_SECONDS - secondsSince(existing?.sent_at);
  if (wait > 0)
    return { success: false, data: { resend_in: wait }, message: `${wait} секундын дараа дахин код авна уу` };

  await deliver(code);

  const at = now();
  const values = {
    otp_hash: hashOtp(key, code),
    expires_at: parseAt(at).add(OTP_TTL_SECONDS, "seconds").format(FORMAT),
    sent_at: at,
    attempts: 0,
    updated_at: at,
  };
  if (existing) await existing.update(values);
  else await model.create({ ...where, created_at: at, ...values });

  return { success: true, data: { expires_in: OTP_TTL_SECONDS, resend_in: OTP_RESEND_SECONDS }, message };
};

// Кодыг шалгана. Зөв бол кодыг устгана (дахин ашиглагдахгүй).
// Буцаах: { success, message }
const verifyOtp = async ({ model, where, key, code }) => {
  const invalid = (message) => ({ success: false, message });

  const row = await model.findOne({ where });
  if (!row) return invalid("Эхлээд код авна уу");
  if (row.attempts >= OTP_MAX_ATTEMPTS) return invalid("Оролдлого хэтэрлээ. Шинэ код авна уу");
  if (moment().isAfter(parseAt(row.expires_at))) return invalid("Кодын хугацаа дууссан. Шинэ код авна уу");

  const matches = crypto.timingSafeEqual(Buffer.from(hashOtp(key, code)), Buffer.from(row.otp_hash));
  if (!matches) {
    await row.increment("attempts");
    return invalid("Код буруу байна");
  }

  await row.destroy();
  return { success: true, message: "" };
};

const subjects = {
  login: "нэвтрэх код",
  // "email:<userId>" - нэвтэрсэн хэрэглэгч имэйлээ солих
  email: "имэйл баталгаажуулах код",
  // "customer-email:<customerId>" - вэбийн зочин имэйлээ солих
  "customer-email": "имэйл баталгаажуулах код",
};
const titleFor = (purpose) => `Cardealer ${subjects[purpose.split(":")[0]] || "баталгаажуулах код"}`;

// --- Имэйл ------------------------------------------------------------------
const otpEmailHtml = (code, title) => `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
  <p style="color:#888;font-size:13px;margin:0 0 8px">Cardealer</p>
  <h2 style="margin:0 0 12px">${title}</h2>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:0 0 12px">${code}</p>
  <p style="color:#555;margin:0">Код ${OTP_TTL_SECONDS / 60} минутын турш хүчинтэй. Та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
</div>`;

const emailKey = (email, purpose) => `${purpose}:${email}`;

module.exports.sendEmailOtp = (email, purpose) =>
  sendOtp({
    model: emailOtps,
    where: { email, purpose },
    key: emailKey(email, purpose),
    code: newOtp(EMAIL_OTP_LENGTH),
    message: "Код имэйлээр илгээлээ",
    deliver: async (code) => {
      if (!process.env.MAIL_USER_NAME || !process.env.MAIL_USER_PASS) {
        if (process.env.NODE_ENV === "production") throw new Error("MAIL_USER_NAME / MAIL_USER_PASS тохируулаагүй");
        console.log(`[dev] ${email} (${purpose}) код: ${code}`);
        return;
      }
      const title = titleFor(purpose);
      const sent = await sendMail(email, { subject: `${title}: ${code}`, html: otpEmailHtml(code, title) });
      if (!sent) throw new Error("Имэйл хаяг буруу байна");
    },
  });

module.exports.verifyEmailOtp = (email, purpose, code) =>
  verifyOtp({ model: emailOtps, where: { email, purpose }, key: emailKey(email, purpose), code });

// --- Утас (SMS) -------------------------------------------------------------
// SMS холбогдоогүй үед (helper/smsHelper.js) код нь OTP_DEV_CODE байна - бусад
// дүрэм (хугацаа, дахин авах хугацаа, оролдлогын тоо) адилхан ажиллана.
const phoneKey = (phonenumber, purpose) => `phone:${purpose}:${phonenumber}`;

module.exports.sendPhoneOtp = (phonenumber, purpose) => {
  const sms = isSmsConfigured();
  return sendOtp({
    model: phoneOtps,
    where: { phonenumber, purpose },
    key: phoneKey(phonenumber, purpose),
    code: sms ? newOtp(PHONE_OTP_LENGTH) : phoneDevCode(),
    message: "Код SMS-ээр илгээлээ",
    deliver: async (code) => {
      if (!sms) {
        console.log(`[sms холбогдоогүй] ${phonenumber} (${purpose}) код: ${code}`);
        return;
      }
      await sendSms(phonenumber, `${titleFor(purpose)}: ${code}`);
    },
  });
};

module.exports.verifyPhoneOtp = (phonenumber, purpose, code) =>
  verifyOtp({ model: phoneOtps, where: { phonenumber, purpose }, key: phoneKey(phonenumber, purpose), code });
