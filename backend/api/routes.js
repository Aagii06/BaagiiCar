const { protect } = require("../middleware/auth");

const Router = require("express").Router();

Router.use("/base", protect, require("./base/router"));
Router.use("/users", require("./users/router"));
Router.use("/cars", require("./cars/router"));
Router.use("/upload", require("./upload/router"));

// test controller
Router.use("/test", require("./test/router"));

module.exports = Router;
