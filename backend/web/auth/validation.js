const { body } = require("express-validator");
const validation = require("../../middleware/validation");

const phonenumberField = () =>
  body("phonenumber")
    .trim()
    .notEmpty()
    .withMessage("Утасны дугаар оруулна уу")
    .matches(/^\d{8}$/)
    .withMessage("8 оронтой утасны дугаар оруулна уу");

module.exports.otpSendValidation = [phonenumberField(), validation];

module.exports.otpLoginValidation = [
  phonenumberField(),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Баталгаажуулах код оруулна уу")
    .matches(/^\d{4}$/)
    .withMessage("Код 4 оронтой тоо байна"),
  validation,
];

// Профайл засах: нэр заавал, и-мэйл сонголттой (утасны дугаар өөрчлөгдөхгүй)
module.exports.updateMeValidation = [
  body("firstname").trim().notEmpty().withMessage("Нэр оруулна уу").isLength({ max: 100 }).withMessage("Нэр хэт урт байна"),
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("И-мэйл формат буруу байна"),
  validation,
];
