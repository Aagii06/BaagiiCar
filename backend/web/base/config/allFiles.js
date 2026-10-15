const { allFiles, op } = require("../../../models");

// Олон нийтэд зөвхөн зарын зургууд харагдана
// Жишээ: /web/base/allFiles?filter=["data_id","=",1]&sort=[{"selector":"order"}]
const list = (req, res, next) => {
  req.where.push({ object_name: "cars", status: { [op.ne]: "deleted" } });
  next();
};

module.exports = {
  model: allFiles,
  middleware: { list },
};
