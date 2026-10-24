const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const { otpSendValidation, otpLoginValidation, updateMeValidation } = require("./validation");
const { otpSend, otpLogin, me, updateMe } = require("./controller");
const { emailOtpSendValidation, emailOtpLoginValidation } = require("../../api/users/validation");
const { emailChangeSend, emailChangeVerify } = require("../../api/users/controller");

// Вэбийн хэрэглэгч: утас + SMS кодоор нэвтрэх (бүртгэлгүй дугаар бол шинээр бүртгэнэ)
router.route("/otp-send").post(otpSendValidation, otpSend);
router.route("/otp-login").post(otpLoginValidation, byAndAt, otpLogin);
// Токеноор нэвтэрсэн хэрэглэгчийн мэдээлэл
router.route("/me").get(protect, me).put(protect, updateMeValidation, byAndAt, updateMe);
// И-мэйл солих: шинэ хаяг руу 6 оронтой код → кодоор баталгаажсаны дараа л солигдоно
router.route("/email-change/send").post(protect, emailOtpSendValidation, emailChangeSend);
router.route("/email-change/verify").post(protect, emailOtpLoginValidation, byAndAt, emailChangeVerify);

module.exports = router;
