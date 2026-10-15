const { areas } = require("../../../models");
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
    .isLength({ max: 255 })
    .withMessage("Нэр 255-с илүү урттай байж болохгүй"),
  ,
];

module.exports = {
  model: areas,
  middleware: { show, list, create, update, lookup, destroy },
  validation: { create: [...customValidation], update: [...customValidation] },
};
