const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { replyValidation } = require("./validation");
const { reply } = require("./controller");

router.route("/reply").post(protect, replyValidation, byAndAt, reply);

module.exports = router;
