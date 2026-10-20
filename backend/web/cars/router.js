const express = require("express");
const router = express.Router();

const { vehicleLookupValidation } = require("./validation");
const { vehicleLookup, approveByPreview } = require("./controller");

// Улсын дугаар / арлын дугаараар машины мэдээлэл татах
router.route("/vehicle-lookup").get(vehicleLookupValidation, vehicleLookup);

// Админы урьдчилан харах түлхүүрээр зарыг батлах
router.route("/approve").post(approveByPreview);

module.exports = router;
