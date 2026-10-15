const { organizationRequests } = require("../../../models");
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
  body("phonenumber")
    .notEmpty()
    .withMessage("Утасны дугаар оруулна уу")
    .isLength({ max: 20 })
    .withMessage("Нэр 20-с илүү урттай байж болохгүй"),
];

module.exports = {
  model: organizationRequests,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [...customValidation],
    update: [...customValidation],
  },
};
