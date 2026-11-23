const jwt = require("jsonwebtoken");
const { roles } = require("../config/constants");

// Нэвтэрсэн эрх сүүлийн үйлдлээс хойш 14 хоног хүчинтэй: хамгаалалттай хүсэлт бүрт
// (цагт нэгээс олонгүй) шинэ токен `X-Refresh-Token` толгойгоор буцаж, клиент солино.
const SESSION_TTL = "14d";
const REFRESH_AFTER_SEC = 60 * 60;

module.exports.authLogin = (user, callback) => {
  jwt.sign(
    { user },
    process.env.JWT_SECRET,
    { expiresIn: SESSION_TTL },
    (err, token) => callback(token),
  );
};

// Токены payload; байхгүй / буруу / хугацаа дууссан бол null
const readPayload = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Токеноос хэрэглэгчийг уншина; байхгүй / буруу / хугацаа дууссан бол null
const readToken = (req) => readPayload(req)?.user ?? null;

// Хүчинтэй токен цагаас хуучин бол шинэ 14 хоногийн токен толгойд нэмнэ.
const refreshSession = (res, payload) => {
  if (!payload?.user || Date.now() / 1000 - (payload.iat ?? 0) < REFRESH_AFTER_SEC) return;
  res.setHeader("X-Refresh-Token", jwt.sign({ user: payload.user }, process.env.JWT_SECRET, { expiresIn: SESSION_TTL }));
};

module.exports.readToken = readToken;

const BLOCKED_MESSAGE = "Таны бүртгэл блоклогдсон байна. Админд хандана уу";
module.exports.BLOCKED_MESSAGE = BLOCKED_MESSAGE;

// Нууц үг сэргээх: SMS кодоор баталгаажсан хэрэглэгчид 30 минутын токен (api/users forgot-*)
module.exports.signPasswordReset = (userId) =>
  jwt.sign({ passwordReset: { id: userId } }, process.env.JWT_SECRET, { expiresIn: "30m" });
module.exports.readPasswordReset = (token) => {
  try {
    return jwt.verify(String(token ?? ""), process.env.JWT_SECRET).passwordReset?.id ?? null;
  } catch (error) {
    return null;
  }
};

const unauthorized = (res) => res.status(401).json({ success: false, message: "Систем рүү нэвтэрнэ үү" });

// Админ / дилер (users хүснэгт). Вэбийн зочны (customers) токен энд хүчингүй:
// түүний id нь customers-ийнх тул users-ийн ижил id-тай андуурагдах ёсгүй.
// Блоклогдсон / идэвхгүй / устгагдсан хэрэглэгчийн хуучин токен хүчингүй.
module.exports.protect = async (req, res, next) => {
  const payload = readPayload(req);
  const user = payload?.user;
  if (!user || user.customer) return unauthorized(res);
  try {
    const { users } = require("../models");
    const row = await users.findOne({ where: { id: user.id }, attributes: ["status"], raw: true });
    if (row?.status === "blocked")
      return res.status(401).json({ success: false, message: BLOCKED_MESSAGE });
    if (row?.status !== "active") return unauthorized(res);
  } catch (error) {
    return next(error);
  }
  req.loggedUser = user;
  refreshSession(res, payload);
  next();
};

// Вэбийн зочин (customers хүснэгт) - зөвхөн /web/auth/otp-login-оор авсан токен
module.exports.protectCustomer = async (req, res, next) => {
  const payload = readPayload(req);
  const user = payload?.user;
  if (!user?.customer) return unauthorized(res);
  req.loggedUser = user;
  refreshSession(res, payload);
  next();
};

// protect-ийн дараа ашиглана
module.exports.isAdmin = (req, res, next) => {
  if (req.loggedUser?.role === roles.admin) return next();
  return res
    .status(200)
    .json({ success: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй" });
};
