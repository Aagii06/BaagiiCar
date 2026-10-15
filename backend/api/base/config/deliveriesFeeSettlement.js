const { deliveriesFeeSettlement } = require("../../../models");

const list = (req, res, next) => {
  next();
};

const show = (req, res, next) => {
  next();
};

const lookup = (req, res, next) => {
  next();
};

module.exports = {
  model: deliveriesFeeSettlement,
  middleware: { show, list, lookup },
  validation: {},
};
