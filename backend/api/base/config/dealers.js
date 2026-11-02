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

// phonenumbers массивыг давхардалгүй JSON болгож, эхнийхийг phonenumber-т хадгална
const normalizePhones = (body) => {
  if (body.phonenumbers === undefined) return;
  const list = [...new Set((body.phonenumbers || []).map((p) => String(p).trim()).filter(Boolean))];
  body.phonenumbers = list.length ? JSON.stringify(list) : null;
  body.phonenumber = list[0] || null;
};

const create = (req, res, next) => {
  req.body.status = req.body.status || "active";
  normalizePhones(req.body);
  isAdmin(req, res, next);
};

const update = (req, res, next) => {
  normalizePhones(req.body);
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
  body("phonenumbers")
    .optional({ nullable: true })
    .isArray({ max: dealers.maxPhones })
    .withMessage(`Утасны дугаар ${dealers.maxPhones}-аас ихгүй байна`),
  body("phonenumbers.*")
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
