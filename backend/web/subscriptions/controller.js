const crypto = require("crypto");
const moment = require("moment");
const { subscriptions, cars } = require("../../models");
const { sendMail } = require("../../helper/mailHelper");

const now = () => moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
const newToken = () => crypto.randomBytes(24).toString("hex");
const hashEndpoint = (endpoint) => crypto.createHash("sha256").update(endpoint).digest("hex");

// Байгаа бол дахин идэвхжүүлж, байхгүй бол шинээр үүсгэнэ
const upsert = async (where, values) => {
  const at = now();
  const existing = await subscriptions.findOne({ where });
  if (existing) await existing.update({ ...values, status: "active", updated_at: at });
  else await subscriptions.create({ ...where, ...values, token: newToken(), status: "active", created_at: at, updated_at: at });
};

const fail = (res, error) => {
  console.log(error);
  return res.status(200).json({ success: false, data: null, message: "Алдаа" });
};

// Хөтөч push бүртгүүлэхэд хэрэгтэй нийтийн түлхүүр
module.exports.pushKey = async (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || null;
  return res.status(200).json({
    success: Boolean(publicKey),
    data: { publicKey },
    message: publicKey ? "Амжилттай" : "Push мэдэгдэл тохируулагдаагүй байна",
  });
};

// --- Имэйл: OTP-оор баталгаажуулна -----------------------------------------
const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 10 * 60;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (email, code) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET || "otp").update(`${email}:${code}`).digest("hex");
const newOtp = () => String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
const parseAt = (value) => moment(value, "YYYY-MM-DD HH:mm:ss").utcOffset("+0800", true);
const secondsSince = (value) => (value ? moment().diff(parseAt(value), "seconds") : Infinity);

const otpEmailHtml = (code) => `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
  <p style="color:#888;font-size:13px;margin:0 0 8px">Cardealer</p>
  <h2 style="margin:0 0 12px">Имэйл баталгаажуулах код</h2>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:0 0 12px">${code}</p>
  <p style="color:#555;margin:0">Код ${OTP_TTL_SECONDS / 60} минутын турш хүчинтэй. Та бүртгүүлээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
</div>`;

// Имэйл хүлээн авч баталгаажуулах код илгээнэ. Баталгаажтал status = "pending"
module.exports.subscribeEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const existing = await subscriptions.findOne({ where: { kind: "email", email } });
    if (existing?.status === "active")
      return res.status(200).json({ success: true, data: { status: "active" }, message: "Энэ имэйл аль хэдийн бүртгэлтэй байна" });

    const wait = OTP_RESEND_SECONDS - secondsSince(existing?.otp_sent_at);
    if (wait > 0)
      return res.status(200).json({ success: false, data: { resend_in: wait }, message: `${wait} секундын дараа дахин код авна уу` });

    const code = newOtp();
    const at = now();
    const otp = {
      otp_hash: hashOtp(email, code),
      otp_expires_at: moment(parseAt(at)).add(OTP_TTL_SECONDS, "seconds").format("YYYY-MM-DD HH:mm:ss"),
      otp_sent_at: at,
      otp_attempts: 0,
      status: "pending",
      updated_at: at,
    };

    if (!process.env.MAIL_USER_NAME || !process.env.MAIL_USER_PASS) {
      if (process.env.NODE_ENV === "production") throw new Error("MAIL_USER_NAME / MAIL_USER_PASS тохируулаагүй");
      console.log(`[dev] ${email} баталгаажуулах код: ${code}`);
    } else {
      await sendMail(email, { subject: `Cardealer баталгаажуулах код: ${code}`, html: otpEmailHtml(code) });
    }

    if (existing) await existing.update(otp);
    else await subscriptions.create({ kind: "email", email, token: newToken(), created_at: at, ...otp });

    return res.status(200).json({
      success: true,
      data: { status: "pending", expires_in: OTP_TTL_SECONDS, resend_in: OTP_RESEND_SECONDS },
      message: "Баталгаажуулах код имэйлээр илгээлээ",
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: "Код илгээж чадсангүй" });
  }
};

module.exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  const invalid = (message) => res.status(200).json({ success: false, data: null, message });
  try {
    const row = await subscriptions.findOne({ where: { kind: "email", email } });
    if (row?.status === "active")
      return res.status(200).json({ success: true, data: { status: "active" }, message: "Бүртгэл баталгаажсан байна" });
    if (!row || row.status !== "pending" || !row.otp_hash) return invalid("Эхлээд баталгаажуулах код авна уу");
    if (row.otp_attempts >= OTP_MAX_ATTEMPTS) return invalid("Оролдлого хэтэрлээ. Шинэ код авна уу");
    if (moment().isAfter(parseAt(row.otp_expires_at))) return invalid("Кодын хугацаа дууссан. Шинэ код авна уу");

    const matches = crypto.timingSafeEqual(Buffer.from(hashOtp(email, code)), Buffer.from(row.otp_hash));
    if (!matches) {
      await row.increment("otp_attempts");
      return invalid("Код буруу байна");
    }

    // Зөвхөн баталгаажсанаас хойш орсон заруудыг илгээнэ
    const lastCarId = (await cars.max("id")) || 0;
    await row.update({
      status: "active",
      otp_hash: null,
      otp_expires_at: null,
      otp_attempts: 0,
      last_car_id: lastCarId,
      last_sent_at: now(),
      updated_at: now(),
    });
    return res.status(200).json({ success: true, data: { status: "active" }, message: "Бүртгэл баталгаажлаа" });
  } catch (error) {
    return fail(res, error);
  }
};

module.exports.subscribePush = async (req, res) => {
  const { endpoint, keys } = req.body;
  try {
    await upsert({ kind: "push", endpoint_hash: hashEndpoint(endpoint) }, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
    return res.status(200).json({ success: true, data: null, message: "Бүртгэгдлээ" });
  } catch (error) {
    return fail(res, error);
  }
};

module.exports.unsubscribePush = async (req, res) => {
  try {
    await subscriptions.update(
      { status: "unsubscribed", updated_at: now() },
      { where: { kind: "push", endpoint_hash: hashEndpoint(req.body.endpoint) } },
    );
    return res.status(200).json({ success: true, data: null, message: "Амжилттай" });
  } catch (error) {
    return fail(res, error);
  }
};

// Имэйл доторх "Бүртгэлээс гарах" холбоос
module.exports.unsubscribe = async (req, res) => {
  try {
    const [count] = await subscriptions.update(
      { status: "unsubscribed", updated_at: now() },
      { where: { token: req.body.token } },
    );
    if (!count) return res.status(200).json({ success: false, data: null, message: "Холбоос хүчингүй байна" });
    return res.status(200).json({ success: true, data: null, message: "Бүртгэлээс гарлаа" });
  } catch (error) {
    return fail(res, error);
  }
};
