const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");

const { sendValidation } = require("./validation");
const { send } = require("./controller");

// Утасны кодоор нэвтэрсэн хэрэглэгч л бичнэ - дугаар нь баталгаажсан байна
router.route("/").post(protect, sendValidation, send);

module.exports = router;
