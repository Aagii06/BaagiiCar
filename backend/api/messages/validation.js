const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.replyValidation = [
  body("id").notEmpty().withMessage("Мессежийн дугаар хоосон байна").isInt({ min: 1 }).toInt(),
  body("reply")
    .trim()
    .notEmpty()
    .withMessage("Хариугаа бичнэ үү")
    .isLength({ max: 2000 })
    .withMessage("Хариу 2000 тэмдэгтээс хэтрэхгүй"),
  validation,
];

module.exports.editReplyValidation = [
  body("reply_id").notEmpty().withMessage("Хариуны дугаар хоосон байна").isInt({ min: 1 }).toInt(),
  body("reply")
    .trim()
    .notEmpty()
    .withMessage("Хариугаа бичнэ үү")
    .isLength({ max: 2000 })
    .withMessage("Хариу 2000 тэмдэгтээс хэтрэхгүй"),
  validation,
];
