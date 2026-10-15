const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { confirmValidation } = require("./validation");

const { confirm } = require("./controller");

router.route("/confirm").post(protect, confirmValidation, byAndAt, confirm);

module.exports = router;
