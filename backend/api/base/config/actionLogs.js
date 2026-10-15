const { actionLogs } = require("../../../models");
const { isAdmin } = require("../../../middleware/auth");

// Үйлдлийн түүхийг зөвхөн админ харна, гараар өөрчлөхгүй
const list = (req, res, next) => {
  isAdmin(req, res, next);
};

const show = (req, res, next) => {
  isAdmin(req, res, next);
};

const lookup = (req, res, next) => {
  isAdmin(req, res, next);
};

module.exports = {
  model: actionLogs,
  middleware: { show, list, lookup },
  validation: {},
};
