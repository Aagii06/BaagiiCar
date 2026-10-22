const { getVehicleInfo } = require("../../helper/autoboxHelper");

// Улсын дугаар: зай авч, том үсэг болгоно ("1698 уао" → "1698УАО")
const normalizePlate = (plate) =>
  plate ? plate.replace(/\s+/g, "").toUpperCase() : null;
const normalizeVin = (vin) => (vin ? vin.trim().toUpperCase() : null);

// Улсын дугаар эсвэл арлын дугаараар autobox.mn-ээс машины мэдээлэл татна (helper/autoboxHelper.js)
module.exports.vehicleLookup = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  try {
    const plate = normalizePlate(req.query.plate);
    const vin = normalizeVin(req.query.vin);

    const info = await getVehicleInfo({ plate, vin });
    return res.status(200).json(info);
  } catch (error) {
    console.log(error);
    result.message = "Машины мэдээлэл татаж чадсангүй. Дахин оролдоно уу";
    return res.status(200).json(result);
  }
};
