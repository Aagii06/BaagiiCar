const { vwCars, cars, op } = require("../../../../models");
const { carStatuses } = require("../../../../config/constants");

// Олон нийтэд устгагдсан болон батлагдаагүй зар харагдахгүй
const hidden = [carStatuses.deleted, carStatuses.pending];

const list = (req, res, next) => {
  req.where.push({ status: { [op.notIn]: hidden } });
  next();
};

const lookup = list;

// Дэлгэрэнгүй үзэх бүрт үзсэн тоог нэмнэ
const show = async (req, res, next) => {
  const { id } = req.params;
  // MySQL дээр [[result, affectedRows]] буцаана
  const [[, affectedRows]] = await cars.increment("view_count", {
    where: { id, status: { [op.notIn]: hidden } },
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
