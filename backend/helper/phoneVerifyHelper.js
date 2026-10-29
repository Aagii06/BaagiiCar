const schedule = require("node-schedule");
const moment = require("moment");
const { users, customers, cars, sequelize, op } = require("../models");
const { roles } = require("../config/constants");
const { saveLog } = require("../utils/logHelper");

// Утсаа phone_verify_deadline-аас өмнө баталгаажуулаагүй users (ADMIN-аас бусад) болон customers-ийг
// бүр мөсөн устгана. Хэрэглэгчийн зарууд (cars.user_id) устахгүй - эхний идэвхтэй админ руу шилжинэ.
// Чат, хадгалсан зар зэрэг нь FK-ийн CASCADE-аар хамт устна.

const now = () => moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
const expired = () => ({ phone_verified_at: null, phone_verify_deadline: { [op.ne]: null, [op.lt]: now() } });

module.exports.runPhoneVerifyCleanup = async () => {
  try {
    const at = now();
    const staleUsers = await users.findAll({
      where: { ...expired(), role: { [op.ne]: roles.admin } },
      attributes: ["id", "phonenumber", "role"],
      raw: true,
    });
    if (staleUsers.length) {
      const admin = await users.findOne({
        where: { role: roles.admin, status: "active" },
        order: [["id", "ASC"]],
        attributes: ["id"],
        raw: true,
      });
      for (const user of staleUsers) {
        const t = await sequelize.transaction();
        try {
          const owned = await cars.count({ where: { user_id: user.id }, transaction: t });
          if (owned && !admin) throw new Error("зар шилжүүлэх идэвхтэй админ алга");
          if (owned) await cars.update({ user_id: admin.id }, { where: { user_id: user.id }, transaction: t, hooks: false });
          await users.destroy({ where: { id: user.id }, transaction: t });
          await saveLog(
            {
              object_name: "users",
              object_id: user.id,
              log_action: "phone_unverified_deleted",
              log_action_mn: "Утсаа баталгаажуулаагүй тул устгагдсан",
              modify_data: JSON.stringify({ ...user, moved_cars: owned }),
              created_at: at,
            },
            t,
          );
          await t.commit();
        } catch (error) {
          await t.rollback();
          console.log(`phone verify cleanup: user ${user.id} устгаж чадсангүй:`, error?.message || error);
        }
      }
    }

    const staleCustomers = await customers.findAll({ where: expired(), attributes: ["id", "phonenumber"], raw: true });
    for (const customer of staleCustomers) {
      try {
        await customers.destroy({ where: { id: customer.id } });
        await saveLog({
          object_name: "customers",
          object_id: customer.id,
          log_action: "phone_unverified_deleted",
          log_action_mn: "Утсаа баталгаажуулаагүй тул устгагдсан",
          modify_data: JSON.stringify(customer),
          created_at: at,
        });
      } catch (error) {
        console.log(`phone verify cleanup: customer ${customer.id} устгаж чадсангүй:`, error?.message || error);
      }
    }
    if (staleUsers.length || staleCustomers.length)
      console.log(`phone verify cleanup: users ${staleUsers.length}, customers ${staleCustomers.length}`);
  } catch (error) {
    console.log("runPhoneVerifyCleanup failed:", error);
  }
};

// Цаг тутам шалгана
module.exports.schedulePhoneVerifyCleanup = () => {
  const rule = new schedule.RecurrenceRule();
  rule.minute = 30;
  rule.tz = "Asia/Ulaanbaatar";
  schedule.scheduleJob(rule, module.exports.runPhoneVerifyCleanup);
};
