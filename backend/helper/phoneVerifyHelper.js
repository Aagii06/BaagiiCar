const schedule = require("node-schedule");
const moment = require("moment");
const { users, customers, op } = require("../models");
const { roles } = require("../config/constants");
const { saveLog } = require("../utils/logHelper");
const { isSmsConfigured } = require("./smsHelper");
const { phoneVerifyDeadline } = require("./phoneVerifyDeadline");

// Утсаа phone_verify_deadline-аас өмнө баталгаажуулаагүй users (ADMIN-аас бусад)-ийг блоклоно (status = "blocked"),
// customers-ийг бүр мөсөн устгана (чат, хадгалсан зар зэрэг нь FK-ийн CASCADE-аар хамт устна).
// SMS холбогдоогүй үед (SMS_GATEWAY_TOKEN хоосон) баталгаажуулах боломжгүй тул устгахгүй, харин
// хугацааг сунгасаар байна - SMS асаасан өдрөөс хойш phoneVerifyDays хоног өгөгдөнө.

const now = () => moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
const expired = () => ({ phone_verified_at: null, phone_verify_deadline: { [op.ne]: null, [op.lt]: now() } });

module.exports.runPhoneVerifyCleanup = async () => {
  try {
    if (!isSmsConfigured()) {
      const deadline = phoneVerifyDeadline();
      const pending = { phone_verified_at: null, phone_verify_deadline: { [op.ne]: null, [op.lt]: deadline } };
      await users.update({ phone_verify_deadline: deadline }, { where: pending, hooks: false });
      await customers.update({ phone_verify_deadline: deadline }, { where: pending, hooks: false });
      return;
    }
    const at = now();
    // users: устгахгүй, "blocked" болгоно - нэвтэрч чадахгүй, админ /users-ийн "Блоклогдсон" хэсгээс
    // идэвхжүүлбэл дахин phoneVerifyDays хоног өгөгдөнө (models/users.js hook). Зарууд нь хэвээр.
    const staleUsers = await users.findAll({
      where: { ...expired(), role: { [op.ne]: roles.admin }, status: "active" },
      attributes: ["id", "phonenumber", "role"],
      raw: true,
    });
    for (const user of staleUsers) {
      try {
        await users.update({ status: "blocked", updated_at: at }, { where: { id: user.id }, hooks: false });
        await saveLog({
          object_name: "users",
          object_id: user.id,
          log_action: "phone_unverified_blocked",
          log_action_mn: "Утсаа баталгаажуулаагүй тул блоклогдсон",
          modify_data: JSON.stringify(user),
          created_at: at,
        });
      } catch (error) {
        console.log(`phone verify cleanup: user ${user.id} блоклож чадсангүй:`, error?.message || error);
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
      console.log(`phone verify cleanup: blocked users ${staleUsers.length}, deleted customers ${staleCustomers.length}`);
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
