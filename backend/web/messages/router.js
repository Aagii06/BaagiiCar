const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");

const { sendValidation, markReadValidation } = require("./validation");
const { send, mine, unread, markRead } = require("./controller");

// Утасны кодоор нэвтэрсэн хэрэглэгч л бичнэ - дугаар нь баталгаажсан байна
router.route("/").get(protect, mine).post(protect, sendValidation, send);
// Админ / дилерийн хариунаас уншаагүйн тоо, яриаг нээхэд уншсан болгох
router.route("/unread").get(protect, unread);
router.route("/read").post(protect, markReadValidation, markRead);

module.exports = router;
