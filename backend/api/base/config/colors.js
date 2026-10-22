const { colors } = require("../../../models");
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
  body("type").isIn(["exterior", "interior"]).withMessage("Өнгөний төрөл буруу байна"),
  body("name_mn").trim().notEmpty().withMessage("Өнгөний нэр оруулна уу"),
  body("hex")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Өнгөний код #RRGGBB хэлбэртэй байна"),
];

module.exports = {
  model: colors,
  middleware: { show, list, create, update, lookup, destroy },
  validation: { create: customValidation, update: customValidation },
};
