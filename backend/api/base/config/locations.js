const { locations } = require("../../../models");
const { body } = require("express-validator");
const { isAdmin } = require("../../../middleware/auth");

// parent_id-аар шүүгээгүй бол зөвхөн аймаг/нийслэлийг буцаана (сум, баг нь parent_id-аар)
const list = (req, res, next) => {
  if (!req.query.filter?.includes("parent_id")) req.where.push({ parent_id: null });
  next();
};

const show = (req, res, next) => {
  next();
};

const lookup = list;

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
    .withMessage("Байршлын нэр оруулна уу")
    .isLength({ max: 255 })
    .withMessage("Байршлын нэр 255-с илүү урттай байж болохгүй"),
];

module.exports = {
  model: locations,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {
    create: [...customValidation],
    update: [...customValidation],
  },
};
