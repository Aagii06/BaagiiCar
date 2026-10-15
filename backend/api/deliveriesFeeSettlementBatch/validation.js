const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.confirmValidation = [
  body("id").notEmpty().withMessage("Баталгаажуулах тооцоогоо сонгоно уу"),
  validation,
];

module.exports.closeValidation = [
  body("id").notEmpty().withMessage("Хаах тооцоогоо сонгоно уу"),
  validation,
];

module.exports.addDeliveryValidation = [
  body("id").notEmpty().withMessage("Тооцооны багцаа сонгоно уу"),
  body("ids").notEmpty().withMessage("Нэмэх хүргэлтүүдээ сонгоно уу"),
  body("ids")
    .isArray()
    .withMessage("Хүргэлтийн дугаарууд хүснэгт хэлбэртэй байх ёстой"),
  validation,
];
