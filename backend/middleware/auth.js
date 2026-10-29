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

const unauthorized = (res) => res.status(401).json({ success: false, message: "Систем рүү нэвтэрнэ үү" });

// Админ / дилер (users хүснэгт). Вэбийн зочны (customers) токен энд хүчингүй:
// түүний id нь customers-ийнх тул users-ийн ижил id-тай андуурагдах ёсгүй.
module.exports.protect = async (req, res, next) => {
  const user = readToken(req);
  if (!user || user.customer) return unauthorized(res);
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
