const { body } = require("express-validator");
const validation = require("../../middleware/validation");
const {
  fuelTypes,
  transmissions,
  driveTypes,
  steerings,
  exteriorColors,
  interiorColors,
} = require("../../config/constants");

const maxYear = new Date().getFullYear() + 1;
const optional = { nullable: true, checkFalsy: true };

module.exports.saveValidation = [
  body("brand_id").notEmpty().withMessage("Брэнд сонгоно уу"),
  body("manufactured_year")
    .notEmpty()
    .withMessage("Үйлдвэрлэсэн он оруулна уу")
    .isInt({ min: 1950, max: maxYear })
    .withMessage("Үйлдвэрлэсэн он буруу байна"),
  body("imported_year")
    .notEmpty()
    .withMessage("Орж ирсэн он оруулна уу")
    .isInt({ min: 1950, max: maxYear })
    .withMessage("Орж ирсэн он буруу байна")
    .custom((value, { req }) => {
      if (Number(value) < Number(req.body.manufactured_year))
        throw new Error("Орж ирсэн он үйлдвэрлэсэн оноос өмнө байж болохгүй");
      return true;
    }),
  body("price")
    .notEmpty()
    .withMessage("Үнэ оруулна уу")
    .isInt({ min: 0 })
    .withMessage("Үнэ зөвхөн тоо байх ёстой"),
  body("mileage")
    .optional(optional)
    .isInt({ min: 0 })
    .withMessage("Гүйлт зөвхөн тоо байх ёстой"),
  body("engine_capacity")
    .optional(optional)
    .isFloat({ min: 0, max: 20 })
    .withMessage("Хөдөлгүүрийн багтаамж буруу байна"),
  body("fuel_type")
    .optional(optional)
    .isIn(fuelTypes)
    .withMessage("Шатахууны төрөл буруу байна"),
  body("transmission")
    .optional(optional)
    .isIn(transmissions)
    .withMessage("Хурдны хайрцаг буруу байна"),
  body("drive_type")
    .optional(optional)
    .isIn(driveTypes)
    .withMessage("Хөтлөгч буруу байна"),
  body("steering")
    .optional(optional)
    .isIn(steerings)
    .withMessage("Жолооны хүрд буруу байна"),
  body("color")
    .optional(optional)
    .isIn(exteriorColors)
    .withMessage("Гадна өнгө буруу байна"),
  body("interior_color")
    .optional(optional)
    .isIn(interiorColors)
    .withMessage("Дотор өнгө буруу байна"),
  body("user_id")
    .optional(optional)
    .isInt({ min: 1 })
    .withMessage("Дилерийн дугаар буруу байна"),
  body("phonenumber")
    .optional(optional)
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("description")
    .optional(optional)
    .isLength({ max: 5000 })
    .withMessage("Тайлбар 5000-с илүү урттай байж болохгүй"),
  validation,
];

module.exports.idValidation = [
  body("id").notEmpty().withMessage("Зарын дугаар хоосон байна"),
  validation,
];

module.exports.favoriteValidation = [
  body("car_id").notEmpty().withMessage("Зарын дугаар хоосон байна"),
  validation,
];
