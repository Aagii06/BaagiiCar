const { vwWithWarehouseOrganization } = require("../../../../models");

const list = (req, res, next) => {
  next();
};

const show = (req, res, next) => {
  next();
};

module.exports = {
  model: vwWithWarehouseOrganization,
  middleware: { show, list },
};
