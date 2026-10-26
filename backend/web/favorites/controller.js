const moment = require("moment");
const { favorites, cars, op } = require("../../models");

const ownIds = async (customerId) =>
  (
    await favorites.findAll({
      where: { customer_id: customerId },
      attributes: ["car_id"],
      order: [["id", "DESC"]],
      raw: true,
    })
  ).map((f) => f.car_id);

// Нэвтэрсэн хэрэглэгчийн хадгалсан зарын id-ууд, сүүлд нэмсэн нь эхэндээ
module.exports.mine = async (req, res) => {
  let result = { success: false, data: [], message: "Амжилттай" };
  try {
    result.success = true;
    result.data = await ownIds(req.loggedUser?.id ?? 0);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// body: { car_ids } - аль хэдийн хадгалсан, устгагдсан зарыг алгасна. Буцаах: бүх хадгалсан id
module.exports.add = async (req, res) => {
  let result = { success: false, data: [], message: "Амжилттай" };
  const customerId = req.loggedUser?.id ?? 0;
  try {
    const existing = await cars.findAll({
      where: { id: { [op.in]: [...new Set(req.body.car_ids)] }, deleted_at: { [op.is]: null } },
      attributes: ["id"],
      raw: true,
    });
    const at = moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
    if (existing.length)
      await favorites.bulkCreate(
        existing.map((c) => ({ customer_id: customerId, car_id: c.id, created_at: at })),
        { ignoreDuplicates: true },
      );
    result.success = true;
    result.data = await ownIds(customerId);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

module.exports.remove = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  try {
    await favorites.destroy({ where: { customer_id: req.loggedUser?.id ?? 0, car_id: req.params.carId } });
    result.success = true;
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};
