const Router = require("express").Router();

// Нэвтрэлтгүй (апп-ын зар үзэх хэсэг) - зөвхөн унших
Router.use("/base", require("./base/router"));
Router.use("/cars", require("./cars/router"));
Router.use("/messages", require("./messages/router"));
Router.use("/subscriptions", require("./subscriptions/router"));
Router.use("/dealers", require("./dealers/router"));
// Вэбийн хэрэглэгчийн нэвтрэлт (утас + код)
Router.use("/auth", require("./auth/router"));

module.exports = Router;
