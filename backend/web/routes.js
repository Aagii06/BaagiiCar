const Router = require("express").Router();

// Нэвтрэлтгүй (апп-ын зар үзэх хэсэг) - зөвхөн унших
Router.use("/base", require("./base/router"));
Router.use("/cars", require("./cars/router"));
Router.use("/subscriptions", require("./subscriptions/router"));

module.exports = Router;
