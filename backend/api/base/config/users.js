const { users } = require("../../../models");
const { body } = require("express-validator");

const list = (req, res, next) => {
  next();
};

const show = (req, res, next) => {
  next();
};

const lookup = (req, res, next) => {
  next();
};

const create = async (req, res, next) => {
  next();
};

const update = async (req, res, next) => {
  next();
};

const destroy = async (req, res, next) => {
  next();
};

const customValidation = [
  body("phonenumber")
    .notEmpty()
    .withMessage("Утасны дугаар оруулаагүй байна")
    .isNumeric()
    .withMessage("Утасны дугаар зөвхөн тоо байх ёстой")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("role").notEmpty().withMessage("Хэрэглэгчийн эрхээ сонгоно уу"),
  body("email")
    .isEmail()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("И-мэйл формат буруу байна"),
];

module.exports = {
  model: users,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [
      ...customValidation,
      body("password").notEmpty().withMessage("Нууц үгээ оруулна уу"),
      // body("password")
      //   .optional({ nullable: true, checkFalsy: true })
      //   .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/, "i")
      //   .withMessage("Нууц үг шаардлага хангахгүй байна"),
      body("password_confirm")
        .notEmpty()
        .withMessage("Нууц үгийн давталт оруулна уу"),
    ],
    update: [...customValidation],
  },
};
