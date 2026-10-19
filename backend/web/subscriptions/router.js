const express = require("express");
const router = express.Router();

const { emailValidation, pushValidation, endpointValidation, tokenValidation } = require("./validation");
const { pushKey, subscribeEmail, subscribePush, unsubscribePush, unsubscribe } = require("./controller");

// Шинэ зарын мэдэгдэл: имэйл болон хөтчийн push
router.route("/push-key").get(pushKey);
router.route("/email").post(emailValidation, subscribeEmail);
router.route("/push").post(pushValidation, subscribePush);
router.route("/push/unsubscribe").post(endpointValidation, unsubscribePush);
router.route("/unsubscribe").post(tokenValidation, unsubscribe);

module.exports = router;
