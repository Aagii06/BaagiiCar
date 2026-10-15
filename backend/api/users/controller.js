const bcrypt = require("bcrypt");
const moment = require("moment");

const { users, sequelize, op } = require("../../models");

const { uploadImage } = require("../../helper/fileHelper");
const { authLogin } = require("../../middleware/auth");
const { saveLog } = require("../../utils/logHelper");

module.exports.save = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  let { id, modifyData, by, at, ...body } = req.body;
  let { files } = req;

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

module.exports.login = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { phonenumber, password, isMobile } = req.body;
  try {
    const findUser = await users.findOne({
      where: { phonenumber, status: "active" },
      attributes: ["id", "password", "role"],
      raw: true,
    });
    if (findUser) {
      if (isMobile) {
        if (findUser.role !== "Жолооч" && findUser.role !== "Харилцагч") {
          return res.status(200).json({
            success: false,
            message: "Системд зөвхөн жолооч нэвтрэх боломжтой",
          });
        }
      }
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
    // const { loggedUser } = req;
    const { id, isAdmin, old_password, password, password_confirm, by, at } =
      req.body;
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
        if (!isAdmin) {
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
    includes: [],
    raw: true,
  });
  if (user === null)
    return { success: false, message: "Хэрэглэгчийн мэдээлэл олдсонгүй" };
  return { success: true, user, message: "" };
};
