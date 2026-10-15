const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.saveValidation = [
  body("name")
    .notEmpty()
    .withMessage("Нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Нэр 255-с илүү урттай байж болохгүй"),
  body("quantity")
    .notEmpty()
    .withMessage("Тоо хэмжээ оруулаагүй байна")
    .isNumeric()
    .withMessage("Тоо хэмжээ зөвхөн тоо байх ёстой"),
  validation,
];
