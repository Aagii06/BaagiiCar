const { customers } = require("../../../models");
const { body } = require("express-validator");
const { isAdmin } = require("../../../middleware/auth");

// Вэбийн зочин хэрэглэгчид өөрсдөө кодоор бүртгүүлнэ (create байхгүй); админ харж, засаж, устгана
const list = (req, res, next) => {
  isAdmin(req, res, next);
};

const show = (req, res, next) => {
  isAdmin(req, res, next);
};

const lookup = (req, res, next) => {
  isAdmin(req, res, next);
};

const update = (req, res, next) => {
  isAdmin(req, res, next);
};

const destroy = (req, res, next) => {
  isAdmin(req, res, next);
};

const customValidation = [
  body("phonenumber")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаар 8 оронтой тоо байна"),
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage("И-мэйл формат буруу байна"),
  body("status")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["active", "inactive"])
    .withMessage("Төлөв буруу байна"),
];

module.exports = {
  model: customers,
  middleware: { show, list, update, lookup, destroy },
  validation: {
    update: [...customValidation],
  },
};
