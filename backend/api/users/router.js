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
  otpSend,
  otpLogin,
  emailOtpSend,
  emailOtpLogin,
  logout,
  getUserData,
  changePassword,
} = require("./controller");

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
router.route("/logout").post(protect, logout);
router.route("/get-user-data").post(protect, getUserData);
router
  .route("/change-password")
  .post(protect, changePasswordValidation, byAndAt, changePassword);

module.exports = router;
