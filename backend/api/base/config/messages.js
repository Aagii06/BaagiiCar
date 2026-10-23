const { messages, sequelize, op } = require("../../../models");
const { body } = require("express-validator");
const { roles } = require("../../../config/constants");
const { dealerIdOf } = require("../../cars/controller");

// Вэбийн чат мессеж: админ бүгдийг, дилер зөвхөн өөрийн дилерийн зарын тухай мессежийг харж, төлөв өөрчилж, устгана.
// Зартай холбоогүй ерөнхий мессеж зөвхөн админд. Шинээр үүсгэх нь /web/messages-ээр.
const ownScope = async (req) => {
  if (req.loggedUser?.role === roles.admin) return null;
  const dealerId = await dealerIdOf(req.loggedUser);
  if (!dealerId) return { id: null }; // дилергүй бол юу ч харахгүй
  return { car_id: { [op.in]: sequelize.literal(`(SELECT id FROM cars WHERE dealer_id = ${sequelize.escape(dealerId)})`) } };
};

const denied = (res) => res.status(200).json({ success: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй" });

const list = async (req, res, next) => {
  const scope = await ownScope(req);
  // AI туслахтай яриа энд орохгүй - зөвхөн зартай холбоотой мессеж
  req.where = [...(req.where || []), { type: "car" }];
  if (scope) req.where.push(scope);
  next();
};

// Нэг мессеж (show / update) хамрах хүрээнд байгаа эсэх
const one = async (req, res, next) => {
  const scope = await ownScope(req);
  if (scope && !(await messages.count({ where: { id: req.params.id, ...scope } }))) return denied(res);
  next();
};

// Дилер зөвхөн төлөвийг (шинэ / хариулсан) өөрчилнө. Устгасан мессежийг "new" болгож сэргээнэ.
const update = async (req, res, next) => {
  if (req.loggedUser?.role !== roles.admin) req.body = { status: req.body.status };
  return one(req, res, next);
};

const destroy = async (req, res, next) => {
  const scope = await ownScope(req);
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (scope && (await messages.count({ where: { id: ids, ...scope } })) !== ids.length) return denied(res);
  next();
};

const create = (req, res) => denied(res);

module.exports = {
  model: messages,
  middleware: { show: one, list, create, update, lookup: list, destroy },
  validation: {
    update: [body("status").optional().isIn(["new", "done"]).withMessage("Төлөв буруу байна")],
  },
};
