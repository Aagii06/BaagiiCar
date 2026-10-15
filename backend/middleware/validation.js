const { validationResult } = require("express-validator");

module.exports = async (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  let extractedErrors = [];
  errors
    .array()
    .forEach(
      (err) =>
        err && extractedErrors.push({ field: err.param, message: err.msg })
    );

  return res
    .status(200)
    .json({ success: false, type: "validation", errors: extractedErrors });
};
