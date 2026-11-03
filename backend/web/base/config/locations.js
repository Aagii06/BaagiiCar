const { locations } = require("../../../models");

// parent_id-аар шүүгээгүй бол зөвхөн аймаг/нийслэлийг буцаана (сум, баг нь parent_id-аар)
const list = (req, res, next) => {
  req.where.push({ status: "active" });
  if (!req.query.filter?.includes("parent_id")) req.where.push({ parent_id: null });
  next();
};

const lookup = list;

module.exports = {
  model: locations,
  middleware: { list, lookup },
};
