const { bodyTypes } = require("../../../models");
const { body } = require("express-validator");
const { isAdmin } = require("../../../middleware/auth");

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
  req.body.status = "active";
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
    .notEmpty()
    .withMessage("Төрлийн нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Төрлийн нэр 255-с илүү урттай байж болохгүй"),
];

module.exports = {
  model: bodyTypes,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [...customValidation],
    update: [...customValidation],
  },
};
