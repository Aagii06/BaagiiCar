const { users, vwCars, vwDealers, sequelize, op } = require("../../models");
const { roles, carStatuses } = require("../../config/constants");

// Дилерийн машин: дилерт хамаарах (user_id) эсвэл дилерийн өөрийн оруулсан (created_by)
const dealerCarsSql = (dealerIdSql) =>
  `(cars.user_id = ${dealerIdSql} OR cars.created_by = ${dealerIdSql}) AND cars.status = ${sequelize.escape(carStatuses.active)}`;

// Имэйл, нууц үг гэх мэт хувийн талбарыг буцаахгүй
const publicAttributes = (dealerIdSql) => [
  "id",
  "firstname",
  "lastname",
  "phonenumber",
  "logo",
  [sequelize.literal(`(SELECT COUNT(*) FROM cars WHERE ${dealerCarsSql(dealerIdSql)})`), "car_count"],
];

const activeDealer = { role: roles.dealer, status: "active" };

// Вэб дээр харагдах дилерүүд (vwDealers: идэвхтэй зартай идэвхтэй DEALER), зарын тоогоор
module.exports.list = async (req, res) => {
  try {
    const rows = await vwDealers.findAll({
      order: [["car_count", "DESC"], ["firstname", "ASC"]],
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
    const dealer = await users.findOne({
      where: { id: req.params.id, ...activeDealer },
      attributes: publicAttributes("users.id"),
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
    const dealer = await users.count({ where: { id, ...activeDealer } });
    if (!dealer) return res.status(200).json({ success: false, data: { rows: [], count: 0 }, message: "Дилер олдсонгүй" });

    const { rows, count } = await vwCars.findAndCountAll({
      where: { status: carStatuses.active, [op.or]: [{ user_id: id }, { created_by: id }] },
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
