const { body } = require("express-validator");
const validation = require("../../middleware/validation");

const optional = { nullable: true, checkFalsy: true };

module.exports.sendValidation = [
  body("name").optional(optional).trim().isLength({ max: 100 }).withMessage("Нэр 100 тэмдэгтээс хэтрэхгүй"),
  body("phonenumber").optional(optional).trim().matches(/^\d{8}$/).withMessage("Утасны дугаар 8 оронтой тоо байна"),
  body("email").optional(optional).trim().isEmail().withMessage("И-мэйл формат буруу байна"),
  body("phonenumber").custom((_, { req }) => {
    if (!req.body.phonenumber && !req.body.email) throw new Error("Утас эсвэл и-мэйлээ оруулна уу");
    return true;
  }),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Асуултаа бичнэ үү")
    .isLength({ max: 2000 })
    .withMessage("Асуулт 2000 тэмдэгтээс хэтрэхгүй"),
  validation,
];
