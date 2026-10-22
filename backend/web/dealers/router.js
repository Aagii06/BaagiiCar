const express = require("express");
const router = express.Router();

const { param } = require("express-validator");
const validation = require("../../middleware/validation");
const { list, show, cars } = require("./controller");

const idValidation = [param("id").isInt({ min: 1 }).withMessage("Дилерийн дугаар буруу байна"), validation];

// Бүртгэлтэй дилерүүд (нийтэд нээлттэй талбарууд л) ба тэдний машинууд
router.route("/").get(list);
router.route("/:id").get(idValidation, show);
router.route("/:id/cars").get(idValidation, cars);

module.exports = router;
