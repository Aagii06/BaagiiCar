const { allFiles } = require("../../../models");

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

module.exports = {
  model: allFiles,
  middleware: { show, list, create, update, lookup, destroy },
  validation: {},
};
