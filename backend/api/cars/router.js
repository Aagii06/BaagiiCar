const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");

const { extractFormData } = require("../../middleware/formData");

const {
  saveValidation,
  idValidation,
  favoriteValidation,
} = require("./validation");

const {
  save,
  markSold,
  toggleFavorite,
  getFavorites,
} = require("./controller");

router
  .route("/save")
  .post(protect, extractFormData, saveValidation, byAndAt, save);
router.route("/mark-sold").post(protect, idValidation, byAndAt, markSold);
router
  .route("/favorite")
  .post(protect, favoriteValidation, byAndAt, toggleFavorite);
router.route("/favorites").get(protect, getFavorites);

module.exports = router;
