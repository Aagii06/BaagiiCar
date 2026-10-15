const { vwBrands } = require("../../../../models");

const list = (req, res, next) => {
  req.where.push({ status: "active" });
  next();
};

const lookup = list;

module.exports = {
  model: vwBrands,
  middleware: { list, lookup },
};
