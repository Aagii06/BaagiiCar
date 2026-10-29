const express = require("express");
const router = express.Router();

const { vehicleLookupValidation } = require("./validation");
const { vehicleLookup, phoneView } = require("./controller");

// Улсын дугаар / арлын дугаараар машины мэдээлэл татах
router.route("/vehicle-lookup").get(vehicleLookupValidation, vehicleLookup);
// Утасны дугаар харах (харсан тоог нэмнэ)
router.route("/:id(\\d+)/phone-view").post(phoneView);

module.exports = router;
