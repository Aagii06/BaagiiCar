const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.saveValidation = [
  body("type").notEmpty().withMessage("Төрөл сонгоно уу"),
  body("name")
    .notEmpty()
    .withMessage("Нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Нэр 255-с илүү урттай байж болохгүй"),
  body("phonenumber")
    .notEmpty()
    .withMessage("Утасны дугаар оруулна уу")
    .isLength({ max: 20 })
    .withMessage("Утасны дугаар 20-с илүү урттай байж болохгүй"),
  body("email")
    .notEmpty()
    .withMessage("И-мэйл оруулна уу")
    .isLength({ max: 100 })
    .withMessage("И-мэйл 100-с илүү урттай байж болохгүй")
    .isEmail()
    .withMessage("И-мэйл формат буруу байна"),
  validation,
];
