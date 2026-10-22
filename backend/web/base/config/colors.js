const { colors } = require("../../../models");

// Вэб: идэвхтэй өнгөнүүд (шүүлтүүр, зарын дэлгэрэнгүй)
const list = (req, res, next) => {
  req.where.push({ status: "active" });
  next();
};

const lookup = list;

module.exports = {
  model: colors,
  middleware: { list, lookup },
};
