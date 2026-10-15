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

module.exports.protect = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      success: false,
      message: "Систем рүү нэвтэрнэ үү",
    });
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Систем рүү нэвтэрнэ үү",
    });
  }

  try {
    const tokenObj = jwt.verify(token, process.env.JWT_SECRET);
    req.loggedUser = tokenObj.user;
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json({ success: false, message: "Систем рүү нэвтэрнэ үү" });
  }
};

// protect-ийн дараа ашиглана
module.exports.isAdmin = (req, res, next) => {
  if (req.loggedUser?.role === roles.admin) return next();
  return res
    .status(200)
    .json({ success: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй" });
};
