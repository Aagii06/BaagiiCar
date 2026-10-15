const { vwBodyTypes } = require("../../../../models");

const list = (req, res, next) => {
  req.where.push({ status: "active" });
  next();
};

const lookup = list;

module.exports = {
  model: vwBodyTypes,
  middleware: { list, lookup },
};
