const { query } = require("express-validator");
const validation = require("../../middleware/validation");

const optional = { nullable: true, checkFalsy: true };

// Улсын дугаар: 4 оронтой тоо + 3 кирилл үсэг (жш: 1234 УБА)
const plateRegex = /^\d{4}\s?[А-ЯЁӨҮ]{3}$/i;
// Арлын дугаар: 17 тэмдэгт VIN эсвэл Япон рамын дугаар (жш: ZVW30-1234567)
const vinRegex = /^[A-HJ-NPR-Z0-9-]{6,17}$/i;

module.exports.vehicleLookupValidation = [
  query("plate").custom((_, { req }) => {
    if (!req.query.plate && !req.query.vin)
      throw new Error("Улсын дугаар эсвэл арлын дугаар оруулна уу");
    return true;
  }),
  query("plate")
    .optional(optional)
    .trim()
    .matches(plateRegex)
    .withMessage("Улсын дугаарын формат буруу байна (жш: 1234 УБА)"),
  query("vin")
    .optional(optional)
    .trim()
    .matches(vinRegex)
    .withMessage("Арлын дугаарын формат буруу байна"),
  validation,
];
