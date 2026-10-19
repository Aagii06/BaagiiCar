const express = require("express");
const router = express.Router();

const { sendValidation } = require("./validation");
const { send } = require("./controller");

router.route("/").post(sendValidation, send);

module.exports = router;
