const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.revertValidation = [
  body("id").notEmpty().withMessage("Буцаах тооцоогоо сонгоно уу"),
  validation,
];
