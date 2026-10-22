const express = require("express");
const router = express.Router();

const { list } = require("./controller");

// Бүртгэлтэй дилерүүдийн жагсаалт (нийтэд нээлттэй талбарууд л)
router.route("/").get(list);

module.exports = router;
