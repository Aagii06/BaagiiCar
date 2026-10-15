const { warehouseProducts } = require("../../../models");
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
  body("quantity")
    .notEmpty()
    .withMessage("Тоо хэмжээ оруулаагүй байна")
    .isNumeric()
    .withMessage("Тоо хэмжээ зөвхөн тоо байх ёстой"),
];

module.exports = {
  model: warehouseProducts,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [...customValidation],
    update: [...customValidation],
  },
};
