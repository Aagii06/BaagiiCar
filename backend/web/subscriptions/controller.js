const crypto = require("crypto");
const moment = require("moment");
const { subscriptions } = require("../../models");

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

module.exports.subscribeEmail = async (req, res) => {
  try {
    await upsert({ kind: "email", email: req.body.email }, {});
    return res.status(200).json({ success: true, data: null, message: "Бүртгэгдлээ" });
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
