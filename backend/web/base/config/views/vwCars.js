const { vwCars, cars, op } = require("../../../../models");
const { carStatuses } = require("../../../../config/constants");

// Нэвтрээгүй хэрэглэгчид устгагдсан зар харагдахгүй
const list = (req, res, next) => {
  req.where.push({ status: { [op.ne]: carStatuses.deleted } });
  next();
};

const lookup = list;

// Дэлгэрэнгүй үзэх бүрт үзсэн тоог нэмнэ
const show = async (req, res, next) => {
  const { id } = req.params;
  // MySQL дээр [[result, affectedRows]] буцаана
  const [[, affectedRows]] = await cars.increment("view_count", {
    where: { id, status: { [op.ne]: carStatuses.deleted } },
  });
  if (!affectedRows)
    return res
      .status(200)
      .json({ success: false, data: null, message: "Зарын мэдээлэл олдсонгүй" });
  next();
};

module.exports = {
  model: vwCars,
  middleware: { show, list, lookup },
};
