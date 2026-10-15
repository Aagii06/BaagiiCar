const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.confirmValidation = [
  body("id").notEmpty().withMessage("Хүсэлт сонгоно уу"),
  body("status")
    .notEmpty()
    .withMessage("Төлөв сонгоно уу")
    .isIn(["confirmed", "notConfirmed"])
    .withMessage("Төлөв буруу байна"),
  validation,
];
