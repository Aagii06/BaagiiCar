const { allFiles } = require("../../../models");
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

// Зарын зургийг /api/cars/save-ээр солино; шууд өөрчлөхийг зөвхөн админд
const create = (req, res, next) => {
  isAdmin(req, res, next);
};

const update = (req, res, next) => {
  isAdmin(req, res, next);
};

const destroy = (req, res, next) => {
  isAdmin(req, res, next);
};

module.exports = {
  model: allFiles,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {},
};
