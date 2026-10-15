const { carModels } = require("../../../models");

const list = (req, res, next) => {
  req.where.push({ status: "active" });
  next();
};

const lookup = list;

module.exports = {
  model: carModels,
  middleware: { list, lookup },
};
