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

// Массивыг давхардалгүй JSON болгож, эхнийхийг ганц утгын баганад хадгална
const normalizeList = (body, listField, singleField, clean = (v) => v) => {
  if (body[listField] === undefined) return;
  const list = [...new Set((body[listField] || []).map((v) => clean(String(v).trim())).filter(Boolean))];
  body[listField] = list.length ? JSON.stringify(list) : null;
  body[singleField] = list[0] || null;
};

const normalizeContacts = (body) => {
  normalizeList(body, "phonenumbers", "phonenumber");
  normalizeList(body, "emails", "email", (v) => v.toLowerCase());
  normalizeList(body, "addresses", "address");
};

const create = (req, res, next) => {
  req.body.status = req.body.status || "active";
  normalizeContacts(req.body);
  isAdmin(req, res, next);
};

const update = (req, res, next) => {
  normalizeContacts(req.body);
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
    .isArray({ max: dealers.maxContacts })
    .withMessage(`Утасны дугаар ${dealers.maxContacts}-аас ихгүй байна`),
  body("phonenumbers.*")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаар 8 оронтой тоо байна"),
  body("emails")
    .optional({ nullable: true })
    .isArray({ max: dealers.maxContacts })
    .withMessage(`И-мэйл ${dealers.maxContacts}-аас ихгүй байна`),
  body("emails.*")
    .trim()
    .isEmail()
    .withMessage("И-мэйл формат буруу байна"),
  // Дилер хэдэн ч салбартай байж болох тул хаягийн тоо хязгааргүй
  body("addresses")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Хаяг буруу байна"),
  body("addresses.*")
    .trim()
    .isLength({ max: 255 })
    .withMessage("Хаяг 255-с илүү урттай байж болохгүй"),
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
