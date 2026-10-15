const express = require("express");
const router = express.Router();

const {
  list,
  lookup,
  show,
  create,
  update,
  destroy,
  uploadFile,
  downloadFile,
} = require("./controller");

const baseList = require("../../middleware/base").list;
const baseShow = require("../../middleware/base").show;

const { byAndAt } = require("../../middleware/timeStamp");

const config = require("./config/index");

// routes
router
  .route("/:target/lookup")
  .get(baseList, config.middleware("lookup"), lookup);

// list & create
router
  .route("/:target")
  .get(baseList, config.middleware("list"), list)
  .post(config.validate("create"), config.middleware("create"), byAndAt, create)
  .delete(
    config.validate("destroy"),
    byAndAt,
    config.middleware("destroy"),
    destroy
  );

// show & update & delete
router
  .route("/:target/:id")
  .get(baseShow, config.middleware("show"), show)
  .put(config.validate("update"), config.middleware("update"), byAndAt, update);

// file router
router.route("/file/upload-file").post(byAndAt, uploadFile);
router.route("/file/download-file").post(downloadFile);

module.exports = router;
