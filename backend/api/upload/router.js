const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../../middleware/auth");
const { extractFormData } = require("../../middleware/formData");

const { uploadImage } = require("./controller");

router.route("/image").post(protect, isAdmin, extractFormData, uploadImage);

module.exports = router;
