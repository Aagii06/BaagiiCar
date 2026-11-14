const express = require("express");
const router = express.Router();

const { sendValidation } = require("./validation");
const { send } = require("./controller");
const { verifyRecaptcha } = require("../../middleware/recaptcha");

// Вэбийн "Бидэнд бичих" маягт (нэвтрэлтгүй ч илгээж болно); reCAPTCHA v2 токен заавал
router.route("/").post(sendValidation, verifyRecaptcha, send);

module.exports = router;
