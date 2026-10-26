const express = require("express");
const router = express.Router();

const { protectCustomer } = require("../../middleware/auth");

const { addValidation, removeValidation } = require("./validation");
const { mine, add, remove } = require("./controller");

// Хадгалсан зар утасны дугаараар нэвтэрсэн хэрэглэгчид хадгалагдана (өөр төхөөрөмж дээр ч харагдана)
router.route("/").get(protectCustomer, mine).post(protectCustomer, addValidation, add);
router.route("/:carId").delete(protectCustomer, removeValidation, remove);

module.exports = router;
