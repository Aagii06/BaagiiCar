const { messages } = require("../../../models");
const { body } = require("express-validator");
const { isAdmin } = require("../../../middleware/auth");

// Вэбийн чат мессеж: зөвхөн админ харж, төлөв өөрчилнө. Шинээр үүсгэх нь /web/messages-ээр.
const adminOnly = (req, res, next) => {
  isAdmin(req, res, next);
};

const create = (req, res) => {
  return res.status(200).json({ success: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй" });
};

module.exports = {
  model: messages,
  middleware: { show: adminOnly, list: adminOnly, create, update: adminOnly, lookup: adminOnly, destroy: adminOnly },
  validation: {
    update: [body("status").optional().isIn(["new", "done"]).withMessage("Төлөв буруу байна")],
  },
};
