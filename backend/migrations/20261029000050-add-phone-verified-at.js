"use strict";

// phone_verified_at: утасны дугаар SMS кодоор баталгаажсан огноо (null - баталгаажаагүй)
// phone_verify_deadline: энэ хугацаанд баталгаажуулаагүй бол бүртгэл бүр мөсөн устна
//   (helper/phoneVerifyHelper.js). ADMIN-д хамаарахгүй (null).
// Дугаар солигдвол models/users.js, models/customers.js-ийн hook дахин тоолж эхэлнэ.

const DAYS = 7;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of ["users", "customers"]) {
      await queryInterface.addColumn(table, "phone_verified_at", { type: Sequelize.STRING, after: "phonenumber" });
      await queryInterface.addColumn(table, "phone_verify_deadline", { type: Sequelize.STRING, after: "phone_verified_at" });
    }
    // Одоо байгаа бүртгэлүүд өнөөдрөөс хойш DAYS хоногийн дотор баталгаажуулна
    const deadline = `DATE_FORMAT(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00') + INTERVAL ${DAYS} DAY, '%Y-%m-%d %H:%i:%s')`;
    await queryInterface.sequelize.query(`UPDATE users SET phone_verify_deadline = ${deadline} WHERE role <> 'ADMIN'`);
    await queryInterface.sequelize.query(`UPDATE customers SET phone_verify_deadline = ${deadline}`);
  },

  async down(queryInterface) {
    for (const table of ["users", "customers"]) {
      await queryInterface.removeColumn(table, "phone_verify_deadline");
      await queryInterface.removeColumn(table, "phone_verified_at");
    }
  },
};
