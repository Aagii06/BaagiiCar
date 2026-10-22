const { dealers } = require("../../../models");
const { body } = require("express-validator");
const { isAdmin } = require("../../../middleware/auth");

// Дилерийн бүртгэлийг зөвхөн админ удирдана
const list = (req, res, next) => {
  next();
};

const show = (req, res, next) => {
  next();
};

const lookup = (req, res, next) => {
  next();
};

const create = (req, res, next) => {
  req.body.status = req.body.status || "active";
  isAdmin(req, res, next);
};

const update = (req, res, next) => {
  isAdmin(req, res, next);
};

const destroy = (req, res, next) => {
  isAdmin(req, res, next);
};

const customValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Дилерийн нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Дилерийн нэр 255-с илүү урттай байж болохгүй"),
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
  model: dealers,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [...customValidation],
    update: [...customValidation],
  },
};
