const { zones } = require("../../../models");
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

const create = (req, res, next) => {
  next();
};

const update = (req, res, next) => {
  next();
};

const destroy = (req, res, next) => {
  next();
};

const customValidation = [
  body("name")
    .notEmpty()
    .withMessage("Нэр оруулна уу")
    .isLength({ max: 30 })
    .withMessage("Нэр 30-с илүү урттай байж болохгүй"),
  body("zone_name")
    .notEmpty()
    .withMessage("Бүсийн нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Бүсийн нэр 255-с илүү урттай байж болохгүй"),
  body("district")
    .notEmpty()
    .withMessage("Дүүрэг сонгоно уу")
    .custom((value) => {
      let parsed;
      try {
        parsed = JSON.parse(value);
      } catch (e) {
        throw new Error("Дүүрэг буруу байна");
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Дүүрэг сонгоно уу");
      }
      return true;
    })
    .isLength({ max: 255 })
    .withMessage("Дүүрэг 255-с илүү урттай байж болохгүй"),
];

module.exports = {
  model: zones,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [...customValidation],
    update: [...customValidation],
  },
};
