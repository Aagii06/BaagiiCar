const { vwCars, cars, op } = require("../../../../models");
const { nonPublicCarStatuses } = require("../../../../config/constants");

// Олон нийтэд устгагдсан, батлагдаагүй, нуусан зар харагдахгүй
const hidden = nonPublicCarStatuses;

// Арлын дугаар (VIN), autobox-ын мэдээлэл (улсын дугаартай) баазад хадгалагдах ч олон нийтэд буцаагдахгүй.
// ?select=[...]-аар хүссэн ч зөвхөн нийтийн талбарууд гарна.
const privateFields = ["vin", "autobox_data", "reject_reason", "rejected_at"];
const publicFields = Object.keys(vwCars.rawAttributes).filter((f) => !privateFields.includes(f));
const publicSelect = (req) => {
  const requested = Array.isArray(req.select) ? req.select.filter((f) => publicFields.includes(f)) : [];
  req.select = requested.length ? requested : publicFields;
};

const list = (req, res, next) => {
  publicSelect(req);
  req.where.push({ status: { [op.notIn]: hidden } });
  next();
};

const lookup = list;

// Дэлгэрэнгүй үзэх бүрт үзсэн тоог нэмнэ
const show = async (req, res, next) => {
  publicSelect(req);
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
