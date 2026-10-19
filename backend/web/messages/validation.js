const { body } = require("express-validator");
const validation = require("../../middleware/validation");

const optional = { nullable: true, checkFalsy: true };

module.exports.sendValidation = [
  body("name").optional(optional).trim().isLength({ max: 100 }).withMessage("Нэр хэт урт байна"),
  body("phonenumber")
    .trim()
    .matches(/^\d{8}$/)
    .withMessage("8 оронтой утасны дугаар оруулна уу"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Мессеж бичнэ үү")
    .isLength({ max: 2000 })
    .withMessage("Мессеж 2000 тэмдэгтээс хэтрэхгүй"),
  body("car_id").optional(optional).isInt({ min: 1 }).toInt(),
  body("page_url").optional(optional).isString().isLength({ max: 500 }),
  validation,
];
