const { getVehicleInfo } = require("../../helper/autoboxHelper");
const { cars, vwCars, op } = require("../../models");
const { nonPublicCarStatuses } = require("../../config/constants");

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

// "Дугаар харах" дарах бүрт тоолж, утасны дугаар болон харсан тоог буцаана
module.exports.phoneView = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  try {
    const where = { id: req.params.id, status: { [op.notIn]: nonPublicCarStatuses } };
    const [[, affectedRows]] = await cars.increment("phone_view_count", { where });
    if (!affectedRows) {
      result.message = "Зарын мэдээлэл олдсонгүй";
      return res.status(200).json(result);
    }
    const car = await vwCars.findOne({ where, attributes: ["phonenumber", "seller_phone", "phone_view_count"], raw: true });
    result.success = true;
    result.message = "Амжилттай";
    result.data = { phone: car.phonenumber || car.seller_phone, phone_view_count: car.phone_view_count };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};
