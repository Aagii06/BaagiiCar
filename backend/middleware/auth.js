const jwt = require("jsonwebtoken");
const { roles } = require("../config/constants");

module.exports.authLogin = (user, callback) => {
  jwt.sign(
    { user },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
    (err, token) => callback(token),
  );
};

// Токеноос хэрэглэгчийг уншина; байхгүй / буруу / хугацаа дууссан бол null
const readToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET).user ?? null;
  } catch (error) {
    console.log(error);
    return null;
  }
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
  const user = readToken(req);
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
  next();
};

// Вэбийн зочин (customers хүснэгт) - зөвхөн /web/auth/otp-login-оор авсан токен
module.exports.protectCustomer = async (req, res, next) => {
  const user = readToken(req);
  if (!user?.customer) return unauthorized(res);
  req.loggedUser = user;
  next();
};

// protect-ийн дараа ашиглана
module.exports.isAdmin = (req, res, next) => {
  if (req.loggedUser?.role === roles.admin) return next();
  return res
    .status(200)
    .json({ success: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй" });
};
