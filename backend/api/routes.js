const { protect } = require("../middleware/auth");

const Router = require("express").Router();

Router.use("/base", protect, require("./base/router"));
Router.use("/users", require("./users/router"));
Router.use("/organizations", require("./organizations/router"));
Router.use("/organization-requests", require("./organizationRequests/router"));
Router.use("/deliveries", require("./deliveries/router"));
Router.use(
  "/deliveries-settlement",
  require("./deliveriesSettlement/router"),
);
Router.use(
  "/deliveries-settlement-batch",
  require("./deliveriesSettlementBatch/router"),
);
Router.use(
  "/deliveries-fee-settlement",
  require("./deliveriesFeeSettlement/router"),
);
Router.use(
  "/deliveries-fee-settlement-batch",
  require("./deliveriesFeeSettlementBatch/router"),
);

Router.use("/warehouse-products", require("./warehouseProducts/router"));

// test controller
Router.use("/test", require("./test/router"));

module.exports = Router;
