const { deliveriesFeeSettlementBatch } = require("../../../models");

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
  model: deliveriesFeeSettlementBatch,
  middleware: { show, list, lookup },
  validation: {},
};
