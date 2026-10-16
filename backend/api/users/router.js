const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { extractFormData } = require("../../middleware/formData");

const {
  saveValidation,
  changePasswordValidation,
  loginValidation,
  registerValidation,
  otpSendValidation,
  otpLoginValidation,
} = require("./validation");

const {
  save,
  login,
  register,
  otpSend,
  otpLogin,
  logout,
  getUserData,
  changePassword,
} = require("./controller");

router
  .route("/save")
  .post(protect, extractFormData, saveValidation, byAndAt, save);

router.route("/login").post(loginValidation, login);
// Вэб: утас + нэг удаагийн кодоор нэвтрэх
router.route("/otp-send").post(otpSendValidation, otpSend);
router.route("/otp-login").post(otpLoginValidation, byAndAt, otpLogin);
router.route("/register").post(registerValidation, byAndAt, register);
router.route("/logout").post(protect, logout);
router.route("/get-user-data").post(protect, getUserData);
router
  .route("/change-password")
  .post(protect, changePasswordValidation, byAndAt, changePassword);

module.exports = router;
