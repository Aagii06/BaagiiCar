const { carModels } = require("../../../models");
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
  body("brand_id").notEmpty().withMessage("Брэнд сонгоно уу"),
  body("name")
    .notEmpty()
    .withMessage("Загварын нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Загварын нэр 255-с илүү урттай байж болохгүй"),
];

module.exports = {
  model: carModels,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [...customValidation],
    update: [...customValidation],
  },
};
