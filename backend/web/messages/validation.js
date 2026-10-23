const { body } = require("express-validator");
const validation = require("../../middleware/validation");

const optional = { nullable: true, checkFalsy: true };

module.exports.sendValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Мессеж бичнэ үү")
    .isLength({ max: 2000 })
    .withMessage("Мессеж 2000 тэмдэгтээс хэтрэхгүй"),
  // AI туслах холбогдоогүй тул одоохондоо зөвхөн зартай холбоотой мессеж
  body("type").optional(optional).isIn(["car"]).withMessage("Мессежийн төрөл буруу байна"),
  body("car_id").optional(optional).isInt({ min: 1 }).toInt(),
  body("page_url").optional(optional).isString().isLength({ max: 500 }),
  validation,
];
