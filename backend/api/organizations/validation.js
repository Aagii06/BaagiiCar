const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.saveValidation = [
  body("name")
    .notEmpty()
    .withMessage("Нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Нэр 255-с илүү урттай байж болохгүй"),
  body("email")
    .notEmpty()
    .withMessage("Имэйл оруулна уу")
    .isEmail()
    .withMessage("Имэйл хаяг буруу байна"),
  validation,
];
