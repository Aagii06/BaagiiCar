"use strict";

// Утасны дугаар SMS кодоор баталгаажсан огноо (null - баталгаажаагүй).
// Дугаар солигдвол models/users.js, models/customers.js-ийн hook null болгоно.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of ["users", "customers"])
      await queryInterface.addColumn(table, "phone_verified_at", { type: Sequelize.STRING, after: "phonenumber" });
  },

  async down(queryInterface) {
    for (const table of ["users", "customers"]) await queryInterface.removeColumn(table, "phone_verified_at");
  },
};
