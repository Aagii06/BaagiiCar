const { users } = require("../../../models");
const { body } = require("express-validator");
const { isAdmin } = require("../../../middleware/auth");
const { roles } = require("../../../config/constants");

// Хэрэглэгчийн удирдлага зөвхөн админд
const list = (req, res, next) => {
  isAdmin(req, res, next);
};

const show = (req, res, next) => {
  isAdmin(req, res, next);
};

const lookup = (req, res, next) => {
  isAdmin(req, res, next);
};

const create = async (req, res, next) => {
  req.body.status = "active";
  isAdmin(req, res, next);
};

const update = async (req, res, next) => {
  isAdmin(req, res, next);
};

const destroy = async (req, res, next) => {
  isAdmin(req, res, next);
};

const customValidation = [
  body("phonenumber")
    .notEmpty()
    .withMessage("Утасны дугаар оруулаагүй байна")
    .isNumeric()
    .withMessage("Утасны дугаар зөвхөн тоо байх ёстой")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("role")
    .notEmpty()
    .withMessage("Хэрэглэгчийн эрхээ сонгоно уу")
    .isIn(Object.values(roles))
    .withMessage("Хэрэглэгчийн эрх буруу байна"),
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
