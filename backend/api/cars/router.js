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
  approve,
  setHidden,
  reject,
  toggleFavorite,
  getFavorites,
} = require("./controller");

router
  .route("/save")
  .post(protect, extractFormData, saveValidation, byAndAt, save);
router.route("/approve").post(protect, idValidation, byAndAt, approve);
router.route("/reject").post(protect, idValidation, byAndAt, reject);
router.route("/set-hidden").post(protect, idValidation, byAndAt, setHidden);
router.route("/mark-sold").post(protect, idValidation, byAndAt, markSold);
router
  .route("/favorite")
  .post(protect, favoriteValidation, byAndAt, toggleFavorite);
router.route("/favorites").get(protect, getFavorites);

module.exports = router;
