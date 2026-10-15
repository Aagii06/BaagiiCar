const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { extractFormData } = require("../../middleware/formData");

const { saveValidation } = require("./validation");

const { save } = require("./controller");

router
  .route("/save")
  .post(protect, extractFormData, saveValidation, byAndAt, save);

module.exports = router;
