const { customers, sequelize, op } = require("../../models");
const { authLogin } = require("../../middleware/auth");
const { saveLog } = require("../../utils/logHelper");
const {
  sendPhoneOtp,
  verifyPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp,
  releaseEmail,
  sendPhoneVerify,
  confirmPhoneVerify,
} = require("../../helper/otpHelper");

// Вэбийн зочин хэрэглэгч customers хүснэгтэд (users-д зөвхөн ADMIN, DEALER).
// Токенд customer: true - protectCustomer үүгээр users-ийн токеноос ялгана.
const findCustomerData = async (id) => {
  const customer = await customers.findOne({ where: { id, status: "active" }, raw: true });
  if (customer === null) return { success: false, message: "Хэрэглэгчийн мэдээлэл олдсонгүй" };
  return { success: true, user: customer, message: "" };
};

// Утас руу нэвтрэх код илгээнэ (SMS_GATEWAY_TOKEN тохируулаагүй бол OTP_DEV_CODE - helper/otpHelper.js)
module.exports.otpSend = async (req, res) => {
  const { phonenumber } = req.body;
  try {
    const result = await sendPhoneOtp(phonenumber, "login");
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: "Код илгээж чадсангүй" });
  }
};

// Утас + кодоор нэвтрэх. Бүртгэлгүй дугаар бол "Зочин" нэртэй шинэ customer үүсгэнэ.
// Буцаах: { token, loggedUser }
module.exports.otpLogin = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  const { phonenumber, code, at } = req.body;
  try {
    let customer = await customers.findOne({
      where: { phonenumber, status: { [op.ne]: "deleted" } },
      attributes: ["id", "status"],
      raw: true,
    });

    if (customer && customer.status !== "active") {
      result.message = "Таны бүртгэл идэвхгүй байна";
      return res.status(200).json(result);
    }

    const verified = await verifyPhoneOtp(phonenumber, "login", code);
    if (!verified.success) {
      result.message = verified.message;
      return res.status(200).json(result);
    }

    if (!customer) {
      const created = await customers.create({
        phonenumber,
        // Кодоор нэвтэрсэн тул утас баталгаажсан
        phone_verified_at: at,
        firstname: "Зочин",
        status: "active",
        created_at: at,
      });
      await saveLog({
        object_name: "customers",
        object_id: created.id,
        log_action: "registered",
        log_action_mn: "Утасны кодоор бүртгүүлсэн",
        created_by: created.id,
        created_at: at,
      });
      customer = { id: created.id };
    }
    // Кодоор нэвтэрсэн тул утас баталгаажсан (bulk update - hook ажиллахгүй тул deadline-ийг шууд арилгана)
    await customers.update(
      {
        last_login_at: at,
        phone_verified_at: sequelize.fn("COALESCE", sequelize.col("phone_verified_at"), at),
        phone_verify_deadline: null,
      },
      { where: { id: customer.id } },
    );

    const { success, user: loggedUser, message } = await findCustomerData(customer.id);
    if (!success) {
      result.message = message;
      return res.status(200).json(result);
    }
    authLogin({ ...loggedUser, customer: true }, (token) => {
      result.success = true;
      result.data = { token, loggedUser };
      return res.status(200).json(result);
    });
  } catch (error) {
    console.log(error);
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};

// Хэрэглэгч устгагдсан / идэвхгүй болсон бол 401 - вэб талд гарсан төлөвт оруулна
module.exports.me = async (req, res) => {
  try {
    const { success, user, message } = await findCustomerData(req.loggedUser?.id);
    if (!success) return res.status(401).json({ success: false, data: null, message: "Систем рүү нэвтэрнэ үү" });
    return res.status(200).json({ success: true, data: user, message });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: "Алдаа" });
  }
};

// Нэвтэрсэн хэрэглэгч нэрээ засна; email: null бол и-мэйлээ устгана (шинэ и-мэйл /email-change-ээр).
// Буцаах: шинэчлэгдсэн хэрэглэгч
module.exports.updateMe = async (req, res) => {
  const { firstname, email, by, at } = req.body;
  if (email)
    return res.status(200).json({ success: false, data: null, message: "И-мэйлээ кодоор баталгаажуулна уу" });
  try {
    const customer = await customers.findOne({ where: { id: req.loggedUser?.id, status: "active" } });
    if (customer === null) return res.status(401).json({ success: false, data: null, message: "Систем рүү нэвтэрнэ үү" });

    const values = { firstname: firstname.trim(), updated_by: by, updated_at: at };
    if (email === null || email === "") values.email = null;
    await customer.update(values);
    const { user: data } = await findCustomerData(customer.id);
    return res.status(200).json({ success: true, data, message: "Амжилттай хадгаллаа" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: typeof error === "string" ? error : "Алдаа" });
  }
};

// --- Имэйл солих: шинэ хаяг руу код илгээж, баталгаажуулсны дараа л солино ----
// users-ийн "email:<id>"-тэй андуурагдахгүйн тулд тусдаа purpose
const emailChangePurpose = (customerId) => `customer-email:${customerId}`;

module.exports.emailChangeSend = async (req, res) => {
  const { email } = req.body;
  try {
    const me = await customers.findOne({ where: { id: req.loggedUser?.id, status: "active" }, attributes: ["id", "email"], raw: true });
    if (!me) return res.status(200).json({ success: false, data: null, message: "Хэрэглэгчийн мэдээлэл олдсонгүй" });
    if ((me.email || "").toLowerCase() === email)
      return res.status(200).json({ success: false, data: null, message: "Одоогийн имэйлтэй ижил байна" });

    const result = await sendEmailOtp(email, emailChangePurpose(me.id));
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: "Код илгээж чадсангүй" });
  }
};

module.exports.emailChangeVerify = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  const { email, code, by, at } = req.body;
  const { loggedUser } = req;
  try {
    const verified = await verifyEmailOtp(email, emailChangePurpose(loggedUser?.id), code);
    if (!verified.success) {
      result.message = verified.message;
      return res.status(200).json(result);
    }
    const t = await sequelize.transaction();
    try {
      // Давхардлыг алдаа болгохгүй - кодоор баталсан тул бусад бүртгэлээс хасна
      await releaseEmail(email, { customerId: loggedUser.id }, t);
      await customers.update(
        { email, updated_by: by, updated_at: at },
        { where: { id: loggedUser.id, status: "active" }, transaction: t },
      );
      await saveLog(
        {
          object_name: "customers",
          object_id: loggedUser.id,
          log_action: "email_changed",
          log_action_mn: "Имэйл солисон",
          modify_data: JSON.stringify({ email }),
          created_by: by,
          created_at: at,
        },
        t,
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
    const { user } = await findCustomerData(loggedUser.id);
    result.success = true;
    result.data = user;
    result.message = "Имэйл баталгаажиж шинэчлэгдлээ";
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};

// --- Утас баталгаажуулах: бүртгэлтэй дугаар руу код илгээж, кодоор баталгаажуулна ----
// Баталгаажуулаагүй бол phone_verify_deadline-ийн дараа бүртгэл устна (helper/phoneVerifyHelper.js)
module.exports.phoneVerifySend = async (req, res) => {
  try {
    const result = await sendPhoneVerify(customers, "cust-phone", req.loggedUser?.id);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: "Код илгээж чадсангүй" });
  }
};

module.exports.phoneVerifyConfirm = async (req, res) => {
  const { code, at } = req.body;
  try {
    const { success, message } = await confirmPhoneVerify(customers, "cust-phone", req.loggedUser?.id, code, at);
    const data = success ? (await findCustomerData(req.loggedUser.id)).user : null;
    return res.status(200).json({ success, data, message });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: "Алдаа" });
  }
};
