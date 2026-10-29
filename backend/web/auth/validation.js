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

const codeField = () =>
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Баталгаажуулах код оруулна уу")
    .matches(/^\d{4}$/)
    .withMessage("Код 4 оронтой тоо байна");

module.exports.otpLoginValidation = [phonenumberField(), codeField(), validation];

// Нэвтэрсэн хэрэглэгч бүртгэлтэй утсаа баталгаажуулах (users, customers хоёулаа)
module.exports.phoneVerifyValidation = [codeField(), validation];

// Профайл засах: нэр заавал. И-мэйлийг энд зөвхөн устгаж болно - шинэ хаягийг /email-change кодоор баталгаажуулна
module.exports.updateMeValidation = [
  body("firstname").trim().notEmpty().withMessage("Нэр оруулна уу").isLength({ max: 100 }).withMessage("Нэр хэт урт байна"),
  validation,
];
