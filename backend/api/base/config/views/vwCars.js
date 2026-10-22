const { vwCars, op } = require("../../../../models");
const { roles } = require("../../../../config/constants");
const { dealerIdOf } = require("../../../cars/controller");

// Админ бүх зарыг, бусад нь зөвхөн өөрийн дилерийн (эсвэл өөрийн оруулсан) зарыг харна
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
  if (scope && !(await vwCars.count({ where: { id: req.params.id, ...scope } })))
    return res.status(200).json({ success: false, data: null, message: "Зар олдсонгүй" });
  next();
};

const lookup = list;

module.exports = {
  model: vwCars,
  middleware: { show, list, lookup },
};
