const { users, op } = require("../../models");
const { authLogin } = require("../../middleware/auth");
const { saveLog } = require("../../utils/logHelper");
const { roles } = require("../../config/constants");
const { sendPhoneOtp, verifyPhoneOtp } = require("../../helper/otpHelper");

const findUserData = async (id) => {
  const user = await users.findOne({
    where: { id, status: "active" },
    attributes: { exclude: ["password", "forgot_pass_token", "forgot_pass_expire_date"] },
    raw: true,
  });
  if (user === null) return { success: false, message: "Хэрэглэгчийн мэдээлэл олдсонгүй" };
  return { success: true, user, message: "" };
};

// Утас руу нэвтрэх код илгээнэ (SMS холбогдох хүртэл OTP_DEV_CODE - helper/otpHelper.js)
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

// Утас + кодоор нэвтрэх. Бүртгэлгүй дугаар бол CUSTOMER эрхтэй шинэ хэрэглэгч үүсгэнэ.
// Буцаах: { token, loggedUser }
module.exports.otpLogin = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  const { phonenumber, code, at } = req.body;
  try {
    let user = await users.findOne({
      where: { phonenumber, status: { [op.ne]: "deleted" } },
      attributes: ["id", "role", "status"],
      raw: true,
    });

    // Админ самбар нууц үгээр нэвтэрнэ
    if (user && user.role === roles.admin) {
      result.message = "Админ эрхтэй хэрэглэгч нууц үгээр нэвтэрнэ үү";
      return res.status(200).json(result);
    }
    if (user && user.status !== "active") {
      result.message = "Таны бүртгэл идэвхгүй байна";
      return res.status(200).json(result);
    }

    const verified = await verifyPhoneOtp(phonenumber, "login", code);
    if (!verified.success) {
      result.message = verified.message;
      return res.status(200).json(result);
    }

    if (!user) {
      const created = await users.create({
        phonenumber,
        role: roles.customer,
        status: "active",
        created_at: at,
      });
      await saveLog({
        object_name: "users",
        object_id: created.id,
        log_action: "registered",
        log_action_mn: "Утасны кодоор бүртгүүлсэн",
        created_by: created.id,
        created_at: at,
      });
      user = { id: created.id };
    }

    const { success, user: loggedUser, message } = await findUserData(user.id);
    if (!success) {
      result.message = message;
      return res.status(200).json(result);
    }
    authLogin(loggedUser, (token) => {
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
    const { success, user, message } = await findUserData(req.loggedUser?.id);
    if (!success) return res.status(401).json({ success: false, data: null, message: "Систем рүү нэвтэрнэ үү" });
    return res.status(200).json({ success: true, data: user, message });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: null, message: "Алдаа" });
  }
};
