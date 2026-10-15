const express = require("express");
const router = express.Router();

const { extractFormData } = require("../../middleware/formData");

const {
  testCyrillicToLatin,
  checkMomentIsBefore,
  checkOrWhere,
  getLastId,
  sendMail,
  imageUpload,
} = require("./controller");

router.route("/test-cyrillic-to-latin").post(testCyrillicToLatin);
router.route("/check-moment-is-before").post(checkMomentIsBefore);
router.route("/check-or-where").post(checkOrWhere);
router.route("/get-last-id").post(getLastId);
router.route("/send-mail").post(sendMail);
router.route("/image-upload").post(extractFormData, imageUpload);

module.exports = router;
