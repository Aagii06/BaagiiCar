const { body } = require("express-validator");
const validation = require("../../middleware/validation");

module.exports.saveValidation = [
  body("product_name")
    .isLength({ max: 445 })
    .withMessage("Нэр 445-с илүү урттай байж болохгүй"),
  body("product_code")
    .isLength({ max: 245 })
    .withMessage("Код 245-с илүү урттай байж болохгүй"),
  body("status").notEmpty().withMessage("Төлөвөө сонгоно уу"),
  body("organization_id").notEmpty().withMessage("Байгууллага сонгоно уу"),
  body("is_paid").notEmpty().withMessage("Тооцоо хийх эсэхээ сонгоно уу"),
  body("paid_amount")
    .if((value, { req }) => req.body.is_paid)
    .notEmpty()
    .withMessage("Тооцоо хийх дүн оруулна уу"),
  body("paid_amount")
    .isNumeric()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("Тооцоо хийх дүн зөвхөн тоо оруулна уу"),
  body("phonenumber")
    .notEmpty()
    .withMessage("Утасны дугаар оруулна уу")
    .isNumeric()
    .withMessage("Утасны дугаар зөвхөн тоо оруулна уу")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("phonenumber2")
    .isNumeric()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("Утасны дугаар зөвхөн тоо байх ёстой")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("address").notEmpty().withMessage("Хаяг оруулна уу"),
  body("status").notEmpty().withMessage("Төлөвөө сонгоно уу"),
  body("confirm_cause")
    .if((value, { req }) => req.body.status === "Цуцалсан")
    .notEmpty()
    .withMessage("Цуцалсан шалтгаанаа сонгоно уу"),
  body("delivery_cause")
    .if((value, { req }) => req.body.status === "Буцаагдсан")
    .notEmpty()
    .withMessage("Буцаагдсан шалтгаанаа сонгоно уу"),
  body("delivery_cause_other")
    .isLength({ max: 445 })
    .withMessage("Нэр 445-с илүү урттай байж болохгүй"),
  body("delivery_after_other")
    .isLength({ max: 445 })
    .withMessage("Нэр 445-с илүү урттай байж болохгүй"),
  // body("receive_by")
  //   .if((value, { req }) => req.body.status === "Хүлээн авсан")
  //   .notEmpty()
  //   .withMessage("Хүлээн авсан жолооч сонгоно уу"),
  body("allocate_to")
    .if((value, { req }) => req.body.status === "Хуваарилагдсан")
    .notEmpty()
    .withMessage("Хүргэлт хийх жолооч сонгоно уу"),
  validation,
];

module.exports.multiCreateValidation = [
  body("organization_id").notEmpty().withMessage("Байгууллага сонгоно уу"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("Хүргэлтийн жагсаалт хоосон байна"),
  body("items.*.phonenumber")
    .notEmpty()
    .withMessage("Утасны дугаар оруулна уу")
    .isNumeric()
    .withMessage("Утасны дугаар зөвхөн тоо оруулна уу")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("items.*.phonenumber2")
    .isNumeric()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("Утасны дугаар зөвхөн тоо байх ёстой")
    .matches(/^\d{8}$/)
    .withMessage("Утасны дугаарын формат таарахгүй байна"),
  body("items.*.address").notEmpty().withMessage("Хаяг оруулна уу"),
  body("items.*.paid_amount")
    .isNumeric()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("Тооцоо хийх дүн зөвхөн тоо оруулна уу"),
  validation,
];

module.exports.receiveValidation = [
  body("id")
    .notEmpty()
    .withMessage("Хүлээн авах хүргэлтийн мэдээлэл сонгоно уу"),
  // body("receive_by").notEmpty().withMessage("Хүлээн авсан жолооч сонгоно уу"),
  validation,
];

module.exports.bulkReceiveValidation = [
  body("ids").notEmpty().withMessage("Хүлээн авах хүргэлтүүдээ сонгоно уу"),
  body("ids")
    .isArray()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("Хүргэлтийн дугаарууд хүснэгт хэлбэртэй байх ёстой"),
  // body("receive_by").notEmpty().withMessage("Хүлээн авсан жолооч сонгоно уу"),
  validation,
];

module.exports.cancelValidation = [
  body("id").notEmpty().withMessage("Цуцлах хүргэлтийн мэдээлэл сонгоно уу"),
  body("cancelled_by").notEmpty().withMessage("Цуцалсан харилцагч сонгоно уу"),
];

module.exports.refundValidation = [
  body("id").notEmpty().withMessage("Буцаах хүргэлтийн мэдээлэл сонгоно уу"),
  body("refund_by").notEmpty().withMessage("Буцаасан харилцагч сонгоно уу"),
];

module.exports.confirmValidation = [
  body("ids").notEmpty().withMessage("Баталгаажуулах хүргэлтүүдээ сонгоно уу"),
  body("ids")
    .isArray()
    .withMessage("Хүргэлтийн дугаарууд хүснэгт хэлбэртэй байх ёстой"),
  body("status").notEmpty().withMessage("Төлөвөө сонгоно уу"),
  body("confirm_cause")
    .if((value, { req }) => req.body.status === "Цуцалсан")
    .notEmpty()
    .withMessage("Цуцалсан шалтгаанаа сонгоно уу"),
  validation,
];

module.exports.allocateValidation = [
  body("ids").notEmpty().withMessage("Хуваарилах хүргэлтүүдээ сонгоно уу"),
  body("allocate_to").notEmpty().withMessage("Жолоочоо сонгоно уу"),
  validation,
];

module.exports.deliveryValidation = [
  body("id")
    .notEmpty()
    .withMessage("Хүргэгдсэн хүргэлтийн мэдээлэл сонгоно уу"),
  body("status").notEmpty().withMessage("Төлөвөө сонгоно уу"),
  body("delivery_cause")
    .if((value, { req }) => req.body.status === "Буцаагдсан")
    .notEmpty()
    .withMessage("Буцаагдсан шалтгаанаа сонгоно уу"),
  validation,
];

module.exports.bulkDeliveryValidation = [
  body("ids").notEmpty().withMessage("Хүргэлтүүдээ сонгоно уу"),
  body("ids")
    .isArray()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("Хүргэлтийн дугаарууд хүснэгт хэлбэртэй байх ёстой"),
  body("delivery_by")
    .notEmpty()
    .withMessage("Хүргэлт хийсэн жолооч сонгоно уу"),
  validation,
];

module.exports.settleValidation = [
  body("ids").notEmpty().withMessage("Тооцоо хийх хүргэлтүүдээ сонгоно уу"),
  body("ids")
    .isArray()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("Хүргэлтийн дугаарууд хүснэгт хэлбэртэй байх ёстой"),
  validation,
];

module.exports.settleFeeValidation = [
  body("ids").notEmpty().withMessage("Тооцоо хийх хүргэлтүүдээ сонгоно уу"),
  body("ids")
    .isArray()
    .optional({ nullable: true, checkFalsy: true })
    .withMessage("Хүргэлтийн дугаарууд хүснэгт хэлбэртэй байх ёстой"),
  validation,
];

module.exports.importValidation = [
  // body("organization_id").notEmpty().withMessage("Харилцагч сонгоно уу"),
  validation,
];
