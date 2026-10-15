const express = require("express");
const router = express.Router();

const { extractFormData } = require("../../middleware/formData");
const { byAndAt } = require("../../middleware/timeStamp");
const { verifyRecaptcha } = require("../../middleware/recaptcha");

const { saveValidation } = require("./validation");

const { save } = require("./controller");

// no `protect` middleware here - public website visitors submit this
// before they have an account, so the request must stay unauthenticated
router
  .route("/save")
  .post(extractFormData, verifyRecaptcha, saveValidation, byAndAt, save);

module.exports = router;
