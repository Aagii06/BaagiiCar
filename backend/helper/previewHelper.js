const jwt = require("jsonwebtoken");

// Админ батлагдаагүй зарыг вэб дээр урьдчилан харах түлхүүр.
// Тухайн зар болон админд холбогдсон, богино хугацаатай.
const EXPIRES_IN = "2h";

module.exports.signPreview = (carId, adminId) =>
  jwt.sign({ preview: Number(carId), by: adminId }, process.env.JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });

// Хүчинтэй бол { preview, by } буцаана, үгүй бол null
module.exports.verifyPreview = (key, carId) => {
  if (!key) return null;
  try {
    const payload = jwt.verify(String(key), process.env.JWT_SECRET);
    return payload.preview === Number(carId) ? payload : null;
  } catch {
    return null;
  }
};
