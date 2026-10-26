const { body, param } = require("express-validator");
const validation = require("../../middleware/validation");

// Нэвтрэхээс өмнө хадгалсан жагсаалтыг нэг дор нэмэх боломжтой тул массив
module.exports.addValidation = [
  body("car_ids").isArray({ min: 1, max: 500 }).withMessage("Зар сонгоно уу"),
  body("car_ids.*").isInt({ min: 1 }).toInt(),
  validation,
];

module.exports.removeValidation = [param("carId").isInt({ min: 1 }).toInt(), validation];
