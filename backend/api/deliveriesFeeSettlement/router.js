const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { revertValidation } = require("./validation");
const { revert } = require("./controller");

router.route("/revert").post(protect, revertValidation, byAndAt, revert);

module.exports = router;
