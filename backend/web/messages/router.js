const express = require("express");
const router = express.Router();

const { protectCustomer } = require("../../middleware/auth");

const { sendValidation, markReadValidation } = require("./validation");
const { send, mine, unread, markRead } = require("./controller");

// Утасны кодоор нэвтэрсэн хэрэглэгч л бичнэ - дугаар нь баталгаажсан байна
router.route("/").get(protectCustomer, mine).post(protectCustomer, sendValidation, send);
// Админ / дилерийн хариунаас уншаагүйн тоо, яриаг нээхэд уншсан болгох
router.route("/unread").get(protectCustomer, unread);
router.route("/read").post(protectCustomer, markReadValidation, markRead);

module.exports = router;
