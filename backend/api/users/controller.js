const bcrypt = require("bcrypt");
const moment = require("moment");

const { users, sequelize, op } = require("../../models");

const { uploadImage } = require("../../helper/fileHelper");
const { authLogin } = require("../../middleware/auth");
const { saveLog } = require("../../utils/logHelper");
const { roles } = require("../../config/constants");

module.exports.save = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  let { id, modifyData, by, at, ...body } = req.body;
  let { files, loggedUser } = req;

  // Админ бус хэрэглэгч зөвхөн өөрийн мэдээллийг засна, эрхээ өөрчилж чадахгүй
  if (loggedUser?.role !== roles.admin) {
    if (!id || id + "" !== loggedUser?.id + "") {
      result.message = "Зөвхөн өөрийн мэдээллийг засах боломжтой";
      return res.status(200).json(result);
    }
    delete body.role;
    delete body.status;
  }
  // Засах үед нууц үгийг /change-password-оор солино
  if (id) {
    delete body.password;
    delete body.password_confirm;
  }

  const t = await sequelize.transaction();
  try {
    const action = id ? "updated" : "created";

    const image = await uploadImage("users", files);
    if (image) body = Object.assign(body, { profile: image });

    let item = null;
    if (id) {
      // update
      item = await users
        .update(
          { ...body, updated_by: by, updated_at: at },
          {
            where: { id, status: { [op.ne]: "deleted" } },
            transaction: t,
            individualHooks: true,
          },
        )
        .then(async () => await users.findByPk(id, { raw: true }));
    } else {
      // create - хэрэв ижил утасны дугаартай устгагдсан хэрэглэгч байвал сэргээнэ
      const deletedUser = body.phonenumber
        ? await users.findOne({
            where: { phonenumber: body.phonenumber, status: "deleted" },
            transaction: t,
          })
        : null;

      if (deletedUser) {
        item = await users
          .update(
            {
              ...body,
              status: "active",
              updated_by: by,
              updated_at: at,
              deleted_by: null,
              deleted_at: null,
            },
            {
              where: { id: deletedUser.id },
              transaction: t,
              individualHooks: true,
            },
          )
          .then(
            async () =>
              await users.findByPk(deletedUser.id, {
                raw: true,
                transaction: t,
              }),
          );
      } else {
        item = await users.create(
          { ...body, status: "active", created_by: by, created_at: at },
          { transaction: t, individualHooks: true },
        );
      }
    }

    if (item) {
      await saveLog(
        {
          object_name: "users",
          object_id: item.id,
          log_action: action,
          modify_data: JSON.stringify(modifyData),
          created_by: by,
          created_at: at,
        },
        t,
      );
    }

    await t.commit();
    result.success = true;
    result.data = { id };
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.success = false;
    result.data = error;
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};

// Админ шинэ хэрэглэгч нэмэх (ямар ч эрхтэй, админ эрхтэй ч байж болно)
module.exports.create = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  const { phonenumber, firstname, lastname, email, role, password, by, at } =
    req.body;
  const body = {
    phonenumber,
    firstname: firstname || null,
    lastname: lastname || null,
    email: email || null,
    role,
    password,
  };

  const t = await sequelize.transaction();
  try {
    // Ижил утасны дугаартай устгагдсан хэрэглэгч байвал сэргээнэ
    let item = await users.findOne({
      where: { phonenumber, status: "deleted" },
      transaction: t,
    });

    if (item) {
      await item.update(
        {
          ...body,
          status: "active",
          updated_by: by,
          updated_at: at,
          deleted_by: null,
          deleted_at: null,
        },
        { transaction: t },
      );
    } else {
      item = await users.create(
        { ...body, status: "active", created_by: by, created_at: at },
        { transaction: t },
      );
    }

    await saveLog(
      {
        object_name: "users",
        object_id: item.id,
        log_action: "created",
        log_action_mn: "Админ нэмсэн",
        created_by: by,
        created_at: at,
      },
      t,
    );

    await t.commit();
    result.success = true;
    result.data = { id: item.id };
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};

module.exports.login = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { phonenumber, password } = req.body;
  try {
    const findUser = await users.findOne({
      where: { phonenumber, status: "active" },
      attributes: ["id", "password", "role"],
      raw: true,
    });
    if (findUser) {
      const currentPassword = findUser.password
        ? findUser.password.toString().replace(/^\$2y/, "$2a")
        : "";
      const isPasswordMatch = await bcrypt.compare(password, currentPassword);

      if (!isPasswordMatch) {
        result.success = false;
        result.message = "Хэрэглэгчийн утасны дугаар эсвэл нууц үг буруу байна";
        return res.status(200).json(result);
      } else {
        delete findUser.password;
        const { success, user, message } = await findUserData(findUser.id);
        // if user data find
        if (success) {
          authLogin(user, async (token) => {
            result.success = true;
            result.data = { token, loggedUser: user };
            console.log(user.phonenumber + " logged in system");
            return res.status(200).json(result);
          });
        } else {
          result.success = false;
          result.message = message;
          return res.status(200).json(result);
        }
      }
    } else {
      result.success = false;
      result.message = "Хэрэглэгчийн утасны дугаар эсвэл нууц үг буруу байна";
      return res.status(200).json(result);
    }
  } catch (error) {
    console.log(error);
    result.success = false;
    result.message = "Алдаа!";
    return res.status(200).json(result);
  }
};

// --- Утас + нэг удаагийн код (OTP) -----------------------------------------
// SMS үйлчилгээ холбогдоогүй тул түр хугацаанд бүх дугаарт ижил код ажиллана
// (.env: OTP_DEV_CODE, анхдагч "2222"). SMS холбогдоход otpSend нь код үүсгэж
// илгээн, otpLogin нь тэр кодыг шалгана.
const otpDevCode = () => process.env.OTP_DEV_CODE || "2222";

module.exports.otpSend = async (req, res) => {
  // TODO: SMS-ээр санамсаргүй код илгээх
  return res.status(200).json({ success: true, data: { sent: true }, message: "Код илгээлээ" });
};

// Кодоор нэвтрэх. Бүртгэлгүй дугаар бол CUSTOMER эрхтэй шинэ хэрэглэгч үүсгэнэ.
module.exports.otpLogin = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  const { phonenumber, code, at } = req.body;
  try {
    if (code !== otpDevCode()) {
      result.message = "Баталгаажуулах код буруу байна";
      return res.status(200).json(result);
    }

    let user = await users.findOne({
      where: { phonenumber, status: { [op.ne]: "deleted" } },
      attributes: ["id", "role", "status"],
      raw: true,
    });

    // Тогтмол кодоор админ эрх авахаас сэргийлнэ: админ нууц үгээр нэвтэрнэ
    if (user && user.role === roles.admin) {
      result.message = "Админ эрхтэй хэрэглэгч нууц үгээр нэвтэрнэ үү";
      return res.status(200).json(result);
    }
    if (user && user.status !== "active") {
      result.message = "Таны бүртгэл идэвхгүй байна";
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
        log_action_mn: "Кодоор бүртгүүлсэн",
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

// Апп-аас өөрөө бүртгүүлэх (Хэрэглэгч эрхтэй)
module.exports.register = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  const { phonenumber, firstname, lastname, email, password, at } = req.body;
  try {
    const user = await users.create({
      phonenumber,
      firstname,
      lastname,
      email,
      password,
      role: roles.customer,
      status: "active",
      created_at: at,
    });
    await saveLog({
      object_name: "users",
      object_id: user.id,
      log_action: "registered",
      log_action_mn: "Бүртгүүлсэн",
      created_by: user.id,
      created_at: at,
    });

    // Бүртгүүлсний дараа шууд нэвтэрсэн төлөвт оруулна
    const { user: loggedUser } = await findUserData(user.id);
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

module.exports.logout = async (req, res) => {
  let result = { data: null, success: true, message: "" };
  console.log("logOut:", req.loggedUser.phonenumber + " logout system");
  return res.status(200).json(result);
};

module.exports.getUserData = async (req, res) => {
  let result = { success: true, loggedUser: null, message: "" };
  try {
    const { loggedUser } = req;
    if (loggedUser) {
      const { success, user, message } = await findUserData(loggedUser.id);
      result.success = success;
      result.loggedUser = user;
      result.message = message;
      return res.status(200).json(result);
    } else {
      result.success = false;
      result.message = "Нэвтэрсэн хэрэглэгчийн мэдээлэл олдсонгүй";
      return res.status(401).json(result);
    }
  } catch (error) {
    console.log(error);
    result.success = false;
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

module.exports.changePassword = async (req, res) => {
  let result = { success: true, data: null, message: "Амжилттай" };

  const t = await sequelize.transaction();
  try {
    const { loggedUser } = req;
    const { id, old_password, password, password_confirm, by, at } = req.body;
    // Админ эсэхийг токеноос шалгана (body-оос итгэхгүй)
    const isAdmin = loggedUser?.role === roles.admin;
    if (!isAdmin && id + "" !== loggedUser?.id + "") {
      await t.rollback();
      result.success = false;
      result.message = "Зөвхөн өөрийн нууц үгийг солих боломжтой";
      return res.status(200).json(result);
    }
    if (password.replace(/\s+/g, "") !== password_confirm.replace(/\s+/g, "")) {
      result.success = false;
      result.message = "Нууц үгийн давталт буруу байна";
      return res.status(200).json(result);
    }

    if (id && password) {
      let user = await users.findByPk(id, { raw: true });
      if (user) {
        if (user.status === "deleted") {
          result.success = false;
          result.message = "Идэвхигүй хэрэглэгч байна";
          return res.status(200).json(result);
        }

        let isPasswordMatch = true;
        // Өөрийн нууц үгийг солиход админ ч гэсэн хуучин нууц үгээ оруулна
        if (!isAdmin || id + "" === loggedUser?.id + "") {
          if (old_password) {
            isPasswordMatch = await bcrypt.compare(old_password, user.password);
            if (!isPasswordMatch) {
              result.success = false;
              result.message = "Хуучин нууц үг таарахгүй байна";
              return res.status(200).json(result);
            }
          } else {
            result.success = false;
            result.message = "Хуучин нууц үгийг оруулаагүй байна";
            return res.status(200).json(result);
          }
        }

        await users.update(
          { password, pass_changed_by: by, pass_changed_at: at },
          {
            where: { id, status: { [op.ne]: "deleted" } },
            individualHooks: true,
            transaction: t,
          },
        );
        await saveLog(
          {
            object_name: "users",
            object_id: id,
            log_action: "change_password",
            modify_data: JSON.stringify({ isAdmin }),
            created_by: by,
            created_at: at,
          },
          t,
        );

        await t.commit();
        result.success = true;
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Хэрэглэгчийн мэдээлэл олдсонгүй";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Нууц үг солих мэдээлэл дутуу байна";
    }

    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.success = false;
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

const findUserData = async (id) => {
  const user = await users.findOne({
    where: { id, status: { [op.ne]: "deleted" } },
    attributes: { exclude: ["password", "forgot_pass_token"] },
    raw: true,
  });
  if (user === null)
    return { success: false, message: "Хэрэглэгчийн мэдээлэл олдсонгүй" };
  return { success: true, user, message: "" };
};
