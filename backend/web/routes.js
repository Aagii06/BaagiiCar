const Router = require("express").Router();

// Нэвтрэлтгүй (апп-ын зар үзэх хэсэг) - зөвхөн унших
Router.use("/base", require("./base/router"));

module.exports = Router;
