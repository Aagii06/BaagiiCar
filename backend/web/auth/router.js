const express = require("express");
const router = express.Router();

const { protectCustomer } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const { otpSendValidation, otpLoginValidation, updateMeValidation } = require("./validation");
const { otpSend, otpLogin, me, updateMe, emailChangeSend, emailChangeVerify } = require("./controller");
const { emailOtpSendValidation, emailOtpLoginValidation } = require("../../api/users/validation");

// Вэбийн зочин: утас + SMS кодоор нэвтрэх (бүртгэлгүй дугаар бол customers-д шинээр бүртгэнэ)
router.route("/otp-send").post(otpSendValidation, otpSend);
router.route("/otp-login").post(otpLoginValidation, byAndAt, otpLogin);
// Токеноор нэвтэрсэн хэрэглэгчийн мэдээлэл
router.route("/me").get(protectCustomer, me).put(protectCustomer, updateMeValidation, byAndAt, updateMe);
// И-мэйл солих: шинэ хаяг руу 6 оронтой код → кодоор баталгаажсаны дараа л солигдоно
router.route("/email-change/send").post(protectCustomer, emailOtpSendValidation, emailChangeSend);
router.route("/email-change/verify").post(protectCustomer, emailOtpLoginValidation, byAndAt, emailChangeVerify);

module.exports = router;
