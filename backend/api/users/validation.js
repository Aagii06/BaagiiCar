const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.saveValidation = [
  body("phonenumber")
    .notEmpty()
    .withMessage("Утасны дугаар оруулна уу")
    .isNumeric()
    .withMessage("Утасны дугаар зөвхөн тоо байх ёстой")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("email")
    .isEmail()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("И-мэйл формат буруу байна"),
  body("firstname").notEmpty().withMessage("Нэр оруулна уу"),
  body("role").notEmpty().withMessage("Хэрэглэгчийн эрх сонгоно уу"),
  body("organization_id")
    .if((value, { req }) => req.body.role === "Харилцагч")
    .notEmpty()
    .withMessage("Байгууллага сонгоно уу"),
  body("zone_id")
    .if((value, { req }) => req.body.role === "Жолооч")
    .notEmpty()
    .withMessage("Бүс сонгоно уу"),
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

module.exports.changePasswordValidation = [
  body("id").notEmpty().withMessage("Хэрэглэгчийн дугаар хоосон байна"),
  body("password").notEmpty().withMessage("Нууц үгээ оруулна уу"),
  // body("password")
  //   .optional({ nullable: true, checkFalsy: true })
  //   .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/, "i")
  //   .withMessage(""),
  body("password_confirm").custom((value, { req }) => {
    if (value !== req.body.password)
      throw new Error("Нууц үгийн давталт буруу байна");
    return true;
  }),
  validation,
];

module.exports.loginValidation = [
  body("phonenumber")
    .notEmpty()
    .withMessage("Утасны дугаар оруулна уу")
    .isNumeric()
    .withMessage("Утасны дугаар зөвхөн тоо байх ёстой")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("password").notEmpty().withMessage("Нууц үг оруулна уу"),
  validation,
];
