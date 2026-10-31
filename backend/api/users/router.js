const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { extractFormData } = require("../../middleware/formData");

const {
  saveValidation,
  createValidation,
  changePasswordValidation,
  loginValidation,
  registerValidation,
  otpSendValidation,
  otpLoginValidation,
  emailOtpSendValidation,
  emailOtpLoginValidation,
} = require("./validation");

const {
  save,
  create,
  login,
  register,
  emailOtpSend,
  emailOtpLogin,
  logout,
  getUserData,
  changePassword,
  emailChangeSend,
  emailChangeVerify,
  phoneVerifySend,
  phoneVerifyConfirm,
  phoneChangeSend,
  phoneChangeVerify,
} = require("./controller");
const { phoneVerifyValidation } = require("../../web/auth/validation");
// Утас + кодоор нэвтрэх логик вэбтэй нэг (web/auth)
const { otpSend, otpLogin } = require("../../web/auth/controller");

router
  .route("/save")
  .post(protect, extractFormData, saveValidation, byAndAt, save);

// Админ шинэ хэрэглэгч нэмэх
router
  .route("/create")
  .post(protect, isAdmin, createValidation, byAndAt, create);

router.route("/login").post(loginValidation, login);
// Вэб: утас + нэг удаагийн кодоор нэвтрэх
router.route("/otp-send").post(otpSendValidation, otpSend);
router.route("/otp-login").post(otpLoginValidation, byAndAt, otpLogin);
// Имэйл + нэг удаагийн кодоор нэвтрэх
router.route("/email-otp-send").post(emailOtpSendValidation, emailOtpSend);
router.route("/email-otp-login").post(emailOtpLoginValidation, byAndAt, emailOtpLogin);
router.route("/register").post(registerValidation, byAndAt, register);
// Нэвтэрсэн хэрэглэгч имэйлээ солих: шинэ хаяг руу код → кодоор баталгаажуулна
router.route("/email-change/send").post(protect, emailOtpSendValidation, emailChangeSend);
router.route("/email-change/verify").post(protect, emailOtpLoginValidation, byAndAt, emailChangeVerify);
// Нэвтэрсэн хэрэглэгч бүртгэлтэй утсаа SMS кодоор баталгаажуулах
router.route("/phone-verify/send").post(protect, phoneVerifySend);
router.route("/phone-verify/confirm").post(protect, phoneVerifyValidation, byAndAt, phoneVerifyConfirm);
// Нэвтэрсэн хэрэглэгч дугаараа солих: шинэ дугаар руу SMS код → кодоор баталгаажсаны дараа л солигдоно
router.route("/phone-change/send").post(protect, otpSendValidation, phoneChangeSend);
router.route("/phone-change/verify").post(protect, otpLoginValidation, byAndAt, phoneChangeVerify);
router.route("/logout").post(protect, logout);
router.route("/get-user-data").post(protect, getUserData);
router
  .route("/change-password")
  .post(protect, changePasswordValidation, byAndAt, changePassword);

module.exports = router;
