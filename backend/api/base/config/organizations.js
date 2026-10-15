const { organizations } = require("../../../models");
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
  body("type").notEmpty().withMessage("Төрөл сонгоно уу"),
  body("name")
    .notEmpty()
    .withMessage("Нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Нэр 255-с илүү урттай байж болохгүй"),
  body("is_warehouse").notEmpty().withMessage("Агуулахтай эсэхээ сонгоно уу"),
  body("warehouse_start_date")
    .if((value, { req }) => req.body.is_warehouse)
    .notEmpty()
    .withMessage("Эхлэх огноо оруулна уу"),
  body("warehouse_expired_date")
    .if((value, { req }) => req.body.is_warehouse)
    .notEmpty()
    .withMessage("Дуусах огноо оруулна уу"),
];

module.exports = {
  model: organizations,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [...customValidation],
    update: [...customValidation],
  },
};
