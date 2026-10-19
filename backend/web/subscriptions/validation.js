const { body } = require("express-validator");
const validation = require("../../middleware/validation");
const { isValidEmail } = require("../../helper/mailHelper");

const emailField = () =>
  body("email")
    .trim()
    .toLowerCase()
    .custom((email) => {
      if (!isValidEmail(email)) throw new Error("Имэйл хаяг буруу байна");
      return true;
    });

module.exports.emailValidation = [emailField(), validation];

module.exports.verifyValidation = [
  emailField(),
  body("code").trim().matches(/^\d{6}$/).withMessage("6 оронтой код оруулна уу"),
  validation,
];

module.exports.pushValidation = [
  body("endpoint").isURL({ protocols: ["https"], require_tld: false }).withMessage("Push endpoint буруу байна"),
  body("keys.p256dh").isString().notEmpty().isLength({ max: 255 }),
  body("keys.auth").isString().notEmpty().isLength({ max: 255 }),
  validation,
];

module.exports.endpointValidation = [body("endpoint").isString().notEmpty(), validation];

module.exports.tokenValidation = [body("token").isString().isLength({ min: 16, max: 64 }), validation];
