const express = require("express");
const router = express.Router();

const { sendValidation } = require("./validation");
const { send } = require("./controller");

// Вэбийн "Бидэнд бичих" маягт (нэвтрэлтгүй ч илгээж болно)
router.route("/").post(sendValidation, send);

module.exports = router;
