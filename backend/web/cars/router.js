const express = require("express");
const router = express.Router();

const { vehicleLookupValidation } = require("./validation");
const { vehicleLookup } = require("./controller");

// Улсын дугаар / арлын дугаараар машины мэдээлэл татах
router.route("/vehicle-lookup").get(vehicleLookupValidation, vehicleLookup);

module.exports = router;
