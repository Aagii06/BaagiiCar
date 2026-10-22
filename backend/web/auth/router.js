const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const { otpSendValidation, otpLoginValidation } = require("./validation");
const { otpSend, otpLogin, me } = require("./controller");

// Вэбийн хэрэглэгч: утас + SMS кодоор нэвтрэх (бүртгэлгүй дугаар бол шинээр бүртгэнэ)
router.route("/otp-send").post(otpSendValidation, otpSend);
router.route("/otp-login").post(otpLoginValidation, byAndAt, otpLogin);
// Токеноор нэвтэрсэн хэрэглэгчийн мэдээлэл
router.route("/me").get(protect, me);

module.exports = router;
