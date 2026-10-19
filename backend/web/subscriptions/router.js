const express = require("express");
const router = express.Router();

const { emailValidation, verifyValidation, pushValidation, endpointValidation, tokenValidation } = require("./validation");
const { pushKey, subscribeEmail, verifyEmail, subscribePush, unsubscribePush, unsubscribe } = require("./controller");

// Шинэ зарын мэдэгдэл: имэйл (OTP-оор баталгаажуулж, тогтмол нэгтгэн илгээнэ) болон хөтчийн push
router.route("/push-key").get(pushKey);
router.route("/email").post(emailValidation, subscribeEmail);
router.route("/email/verify").post(verifyValidation, verifyEmail);
router.route("/push").post(pushValidation, subscribePush);
router.route("/push/unsubscribe").post(endpointValidation, unsubscribePush);
router.route("/unsubscribe").post(tokenValidation, unsubscribe);

module.exports = router;
