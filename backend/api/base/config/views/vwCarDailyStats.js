const { vwCarDailyStats } = require("../../../../models");
const { ownScope } = require("./vwCars");

// Зарын өдөр тутмын үзсэн тоо: vwCars-тай адил админ бүгдийг, бусад нь зөвхөн өөрийн зарынхыг харна
const list = async (req, res, next) => {
  const scope = await ownScope(req);
  if (scope) req.where = [...(req.where || []), scope];
  next();
};

module.exports = {
  model: vwCarDailyStats,
  middleware: { list, lookup: list },
};
