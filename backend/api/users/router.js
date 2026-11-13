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
  passwordChangeSendValidation,
  passwordChangeVerifyValidation,
  forgotSendValidation,
  forgotVerifyValidation,
  forgotResetValidation,
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
  passwordChangeSend,
  passwordChangeVerify,
  emailChangeSend,
  emailChangeVerify,
  phoneVerifySend,
  phoneVerifyConfirm,
  phoneChangeSend,
  phoneChangeVerify,
  forgotSend,
  forgotVerify,
  forgotReset,
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
// Нууц үгээ мартсан: утас → SMS код → баталгаажуулж reset_token → шинэ нууц үг
router.route("/forgot/send").post(forgotSendValidation, forgotSend);
router.route("/forgot/verify").post(forgotVerifyValidation, forgotVerify);
router.route("/forgot/reset").post(forgotResetValidation, byAndAt, forgotReset);
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

// Өөрийн нууц үг солих: хуучин нууц үг шалгаад бүртгэлтэй имэйл рүү код → кодоор баталгаажсаны дараа л солигдоно
router.route("/password-change/send").post(protect, passwordChangeSendValidation, passwordChangeSend);
router.route("/password-change/verify").post(protect, passwordChangeVerifyValidation, byAndAt, passwordChangeVerify);

module.exports = router;
