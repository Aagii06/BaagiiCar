const { dealers, vwCars, vwDealers, sequelize } = require("../../models");
const { carStatuses } = require("../../config/constants");

// Имэйл гэх мэт дотоод талбарыг буцаахгүй
const publicAttributes = [
  "id",
  "name",
  "phonenumber",
  "logo",
  "address",
  [
    sequelize.literal(`(SELECT COUNT(*) FROM cars WHERE cars.dealer_id = dealers.id AND cars.status = ${sequelize.escape(carStatuses.active)})`),
    "car_count",
  ],
];

const activeDealer = { status: "active" };

// Вэб дээр харагдах дилерүүд (vwDealers: идэвхтэй зартай идэвхтэй дилер), зарын тоогоор
module.exports.list = async (req, res) => {
  try {
    const rows = await vwDealers.findAll({
      order: [["car_count", "DESC"], ["name", "ASC"]],
      raw: true,
    });
    return res.status(200).json({ success: true, data: { rows, count: rows.length }, message: "" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: { rows: [], count: 0 }, message: "Алдаа" });
  }
};

module.exports.show = async (req, res) => {
  try {
    const dealer = await dealers.findOne({
      where: { id: req.params.id, ...activeDealer },
      attributes: publicAttributes,
      raw: true,
    });
    if (!dealer) return res.status(200).json({ success: false, data: null, message: "Дилер олдсонгүй" });
    return res.status(200).json({ success: true, data: dealer, message: "" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: "Алдаа" });
  }
};

// Дилерийн вэб дээр харагдах машинууд, шинэ нь эхэндээ. ?take=12&skip=0
module.exports.cars = async (req, res) => {
  const id = req.params.id;
  const take = Math.min(Math.max(parseInt(req.query.take, 10) || 12, 1), 60);
  const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
  try {
    const dealer = await dealers.count({ where: { id, ...activeDealer } });
    if (!dealer) return res.status(200).json({ success: false, data: { rows: [], count: 0 }, message: "Дилер олдсонгүй" });

    const { rows, count } = await vwCars.findAndCountAll({
      where: { status: carStatuses.active, dealer_id: id },
      // Арлын дугаар, autobox-ын мэдээллийг олон нийтэд буцаахгүй
      attributes: { exclude: ["vin", "autobox_data", "reject_reason", "rejected_at"] },
      order: [["created_at", "DESC"], ["id", "DESC"]],
      limit: take,
      offset: skip,
    });
    return res.status(200).json({ success: true, data: { rows, count }, message: "" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: { rows: [], count: 0 }, message: "Алдаа" });
  }
};
