const { cars, op } = require("../../../models");
const { roles, carStatuses } = require("../../../config/constants");
const { dealerIdOf } = require("../../cars/controller");

// Админ бүх зарыг, бусад нь зөвхөн өөрийн дилерийн (эсвэл өөрийн оруулсан) зарыг (самбарын тоолуур)
const ownScope = async (req) => {
  if (req.loggedUser?.role === roles.admin) return null;
  const dealerId = await dealerIdOf(req.loggedUser);
  return dealerId ? { [op.or]: [{ dealer_id: dealerId }, { user_id: req.loggedUser?.id }] } : { user_id: req.loggedUser?.id };
};

const list = async (req, res, next) => {
  const scope = await ownScope(req);
  if (scope) req.where = [...(req.where || []), scope];
  next();
};

const show = async (req, res, next) => {
  const scope = await ownScope(req);
  if (scope && !(await cars.count({ where: { id: req.params.id, ...scope } })))
    return res.status(200).json({ success: false, data: null, message: "Зар олдсонгүй" });
  next();
};

const lookup = list;

// Зар үүсгэх/засах нь зурагтай тул /api/cars/save-ээр дамжина (create, update энд байхгүй)

// Админ бүгдийг устгана. Дилер өөрийн дилерийн зарыг устгана, гэхдээ идэвхтэй / зарагдсаныг биш (нууж болно)
const destroy = async (req, res, next) => {
  const { loggedUser } = req;
  const { ids } = req.body;
  if (loggedUser?.role === roles.admin) return next();
  if (!Array.isArray(ids) || ids.length === 0) return next();

  const dealerId = await dealerIdOf(loggedUser);
  const mine = dealerId ? { [op.or]: [{ dealer_id: dealerId }, { user_id: loggedUser?.id }] } : { user_id: loggedUser?.id };
  const ownCount = await cars.count({ where: { id: ids, ...mine } });
  const othersCount = ids.length - ownCount;
  if (othersCount > 0)
    return res
      .status(200)
      .json({ success: false, message: "Зөвхөн өөрийн зарыг устгах боломжтой" });
  const locked = await cars.count({ where: { id: ids, status: [carStatuses.active, carStatuses.sold] } });
  if (locked > 0)
    return res
      .status(200)
      .json({ success: false, message: "Идэвхтэй болон зарагдсан зарыг устгах боломжгүй. Нууж болно" });
  next();
};

module.exports = {
  model: cars,
  middleware: { show, list, lookup, destroy },
  validation: {},
};
