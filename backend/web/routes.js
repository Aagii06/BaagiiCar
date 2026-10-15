const { protect } = require("../middleware/auth");

const Router = require("express").Router();

Router.use("/base", require("./base/router"));
Router.use("/organization-requests", require("./organizationRequests/router"));

module.exports = Router;
