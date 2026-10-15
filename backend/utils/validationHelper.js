const { op } = require("../models");

module.exports.validate = (validations) => async (req, res, next) => {
  let errArr = [];
  for (let validation of validations) {
    if (validation) {
      const result = await validation.run(req);
      if (Array.isArray(result.errors) && result.errors.length > 0)
        errArr.push(result.errors[0]);
    }
    // if (result.errors.length) break;
  }

  // const errors = validationResult(req);
  if (errArr.length === 0) return next();

  const extractedErrors = [];
  errArr.forEach(
    (err) =>
      err && extractedErrors.push({ field: err.param, message: err.msg }),
  );
  return res
    .status(200)
    .json({ success: false, type: "validation", errors: extractedErrors });
};

module.exports.checkDuplicateData = async ({ model, fields, body, id }) => {
  const oldData = id ? await model.findOne({ where: { id } }) : {};
  let where = {};
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    where[field] = body[field]
      ? body[field]
      : oldData[field]
        ? oldData[field]
        : null;
  }
  if (id) where.id = { [op.ne]: id };
  const check = await model.findOne({ where });
  if (check) return false;
  return true;
};
