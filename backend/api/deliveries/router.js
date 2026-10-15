const express = require("express");
const router = express.Router();

const baseList = require("../../middleware/base").list;

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { extractFormData } = require("../../middleware/formData");

const {
  saveValidation,
  multiCreateValidation,
  receiveValidation,
  cancelValidation,
  refundValidation,
  bulkReceiveValidation,
  confirmValidation,
  allocateValidation,
  deliveryValidation,
  bulkDeliveryValidation,
  settleValidation,
  settleFeeValidation,
  importValidation,
} = require("./validation");

const {
  save,
  multiCreate,
  receive,
  bulkReceive,
  confirm,
  cancel,
  refund,
  allocate,
  delivery,
  changeSwitch,
  bulkDelivery,
  settle,
  settleFee,
  exportExcel,
  importExcel,
} = require("./controller");

router
  .route("/save")
  .post(protect, extractFormData, saveValidation, byAndAt, save);
router
  .route("/multi-create")
  .post(protect, multiCreateValidation, byAndAt, multiCreate);
router
  .route("/receive")
  .post(protect, extractFormData, receiveValidation, byAndAt, receive);
router.route("/cancel").post(protect, cancelValidation, byAndAt, cancel);
router.route("/refund").post(protect, refundValidation, byAndAt, refund);
router
  .route("/bulk-receive")
  .post(protect, bulkReceiveValidation, byAndAt, bulkReceive);
router.route("/confirm").post(protect, confirmValidation, byAndAt, confirm);
router.route("/allocate").post(protect, allocateValidation, byAndAt, allocate);
router.route("/delivery").post(protect, deliveryValidation, byAndAt, delivery);
router
  .route("/bulk-delivery")
  .post(protect, bulkDeliveryValidation, byAndAt, bulkDelivery);

router.route("/settle").post(protect, settleValidation, byAndAt, settle);
router
  .route("/settle-fee")
  .post(protect, settleFeeValidation, byAndAt, settleFee);

router
  .route("/change-switch")
  .post(protect, deliveryValidation, byAndAt, changeSwitch);

// export
router.route("/export-excel").post(protect, baseList, byAndAt, exportExcel);
router
  .route("/import-excel")
  .post(protect, extractFormData, importValidation, byAndAt, importExcel);

module.exports = router;
