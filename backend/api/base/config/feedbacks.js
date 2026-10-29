const { feedbacks } = require("../../../models");
const { body } = require("express-validator");
const { isAdmin } = require("../../../middleware/auth");

// Вэбийн "Бидэнд бичих" санал хүсэлт: зөвхөн админ харж, уншсан болгож, устгана. Шинээр үүсгэх нь /web/feedbacks-ээр.
const adminOnly = (req, res, next) => isAdmin(req, res, next);

// Админ зөвхөн төлөвийг өөрчилнө
const update = (req, res, next) => {
  req.body = { status: req.body.status };
  return isAdmin(req, res, next);
};

module.exports = {
  model: feedbacks,
  middleware: { show: adminOnly, list: adminOnly, lookup: adminOnly, update, destroy: adminOnly },
  validation: {
    update: [body("status").isIn(["new", "seen"]).withMessage("Төлөв буруу байна")],
  },
};
