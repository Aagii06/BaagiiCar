const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const {
  confirmValidation,
  closeValidation,
  addDeliveryValidation,
} = require("./validation");
const { confirm, close, addDelivery } = require("./controller");

router.route("/confirm").post(protect, confirmValidation, byAndAt, confirm);
router.route("/close").post(protect, closeValidation, byAndAt, close);
router
  .route("/add-delivery")
  .post(protect, addDeliveryValidation, byAndAt, addDelivery);

module.exports = router;
