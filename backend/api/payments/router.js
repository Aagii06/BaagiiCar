const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const c = require("./controller");

// Дилерийн данс, админы төлбөрийн тохиргоо (controller.js)
router.get("/info", protect, c.info);
router.get("/settings", protect, c.getSettings);
router.put("/settings", protect, byAndAt, c.saveSettings);
router.get("/transactions", protect, c.transactions);
router.get("/balances", protect, c.balances);
router.post("/topup/qpay", protect, byAndAt, c.topupQpay);
router.post("/topup/qpay/check", protect, c.checkQpay);
router.post("/topup/bank", protect, byAndAt, c.topupBank);
router.post("/transactions/approve", protect, byAndAt, c.approve);
router.post("/transactions/reject", protect, byAndAt, c.reject);
router.post("/adjust", protect, byAndAt, c.adjust);

module.exports = router;
