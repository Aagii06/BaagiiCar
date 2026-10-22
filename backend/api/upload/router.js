const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { extractFormData } = require("../../middleware/formData");

const { uploadImage } = require("./controller");

// Каталог, дилерийн лого зөвхөн админ; профайл зураг (users) нэвтэрсэн хэн ч (controller шалгана)
router.route("/image").post(protect, extractFormData, uploadImage);

module.exports = router;
