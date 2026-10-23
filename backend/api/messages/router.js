const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { replyValidation, editReplyValidation } = require("./validation");
const { reply, editReply, replies } = require("./controller");

router.route("/reply").post(protect, replyValidation, byAndAt, reply);
router.route("/reply-edit").post(protect, editReplyValidation, byAndAt, editReply);
router.route("/replies").get(protect, replies);

module.exports = router;
