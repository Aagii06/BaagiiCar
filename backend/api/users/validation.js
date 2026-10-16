const { body } = require("express-validator");
const validation = require("../../middleware/validation");
const { roles } = require("../../config/constants");

const phonenumberValidation = (message) =>
  body("phonenumber")
    .notEmpty()
    .withMessage(message)
    .isNumeric()
    .withMessage("Утасны дугаар зөвхөн тоо байх ёстой")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна");

const passwordConfirmValidation = body("password_confirm").custom(
  (value, { req }) => {
    if (value !== req.body.password)
      throw new Error("Нууц үгийн давталт буруу байна");
    return true;
  },
);

module.exports.saveValidation = [
  phonenumberValidation("Утасны дугаар оруулна уу"),
  body("email")
    .isEmail()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("И-мэйл формат буруу байна"),
  body("firstname").notEmpty().withMessage("Нэр оруулна уу"),
  body("role")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(Object.values(roles))
    .withMessage("Хэрэглэгчийн эрх буруу байна"),
  body("role")
    .if((value, { req }) => !req.body.id)
    .notEmpty()
    .withMessage("Хэрэглэгчийн эрх сонгоно уу"),
  body("password")
    .if((value, { req }) => !req.body.id)
    .notEmpty()
    .withMessage("Нууц үгээ оруулна уу"),
  body("password_confirm")
    .if((value, { req }) => !req.body.id)
    .custom((value, { req }) => {
      if (value !== req.body.password)
        throw new Error("Нууц үгийн давталт буруу байна");
      return true;
    }),
  validation,
];

module.exports.registerValidation = [
  phonenumberValidation("Утасны дугаар оруулна уу"),
  body("firstname").notEmpty().withMessage("Нэр оруулна уу"),
  body("email")
    .isEmail()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("И-мэйл формат буруу байна"),
  body("password")
    .notEmpty()
    .withMessage("Нууц үгээ оруулна уу")
    .isLength({ min: 6 })
    .withMessage("Нууц үг хамгийн багадаа 6 тэмдэгт байна"),
  passwordConfirmValidation,
  validation,
];

module.exports.changePasswordValidation = [
  body("id").notEmpty().withMessage("Хэрэглэгчийн дугаар хоосон байна"),
  body("password").notEmpty().withMessage("Нууц үгээ оруулна уу"),
  // body("password")
  //   .optional({ nullable: true, checkFalsy: true })
  //   .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/, "i")
  //   .withMessage(""),
  passwordConfirmValidation,
  validation,
];

// Код илгээх: зөвхөн утасны дугаар
module.exports.otpSendValidation = [
  phonenumberValidation("Утасны дугаар оруулна уу"),
  validation,
];

// Кодоор нэвтрэх
module.exports.otpLoginValidation = [
  phonenumberValidation("Утасны дугаар оруулна уу"),
  body("code")
    .notEmpty()
    .withMessage("Баталгаажуулах код оруулна уу")
    .matches(/^\d{4}$/)
    .withMessage("Код 4 оронтой тоо байна"),
  validation,
];

module.exports.loginValidation = [
  phonenumberValidation("Утасны дугаар оруулна уу"),
  body("password").notEmpty().withMessage("Нууц үг оруулна уу"),
  validation,
];
