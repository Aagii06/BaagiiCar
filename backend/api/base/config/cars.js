const { cars, op } = require("../../../models");
const { roles } = require("../../../config/constants");

const list = (req, res, next) => {
  next();
};

const show = (req, res, next) => {
  next();
};

const lookup = (req, res, next) => {
  next();
};

// Зар үүсгэх/засах нь зурагтай тул /api/cars/save-ээр дамжина (create, update энд байхгүй)

// Зөвхөн өөрийн зарыг устгана, админ бүгдийг устгаж болно
const destroy = async (req, res, next) => {
  const { loggedUser } = req;
  const { ids } = req.body;
  if (loggedUser?.role === roles.admin) return next();
  if (!Array.isArray(ids) || ids.length === 0) return next();

  const othersCount = await cars.count({
    where: { id: ids, user_id: { [op.ne]: loggedUser?.id } },
  });
  if (othersCount > 0)
    return res
      .status(200)
      .json({ success: false, message: "Зөвхөн өөрийн зарыг устгах боломжтой" });
  next();
};

module.exports = {
  model: cars,
  middleware: { show, list, lookup, destroy },
  validation: {},
};
