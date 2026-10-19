"use strict";

// users.role: монгол нэрээс ADMIN / DEALER / CUSTOMER болгоно
const mapping = [
  ["Админ", "ADMIN"],
  ["Дилер", "DEALER"],
  ["Хэрэглэгч", "CUSTOMER"],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const [from, to] of mapping) await queryInterface.bulkUpdate("users", { role: to }, { role: from });
  },

  async down(queryInterface) {
    for (const [from, to] of mapping) await queryInterface.bulkUpdate("users", { role: from }, { role: to });
  },
};
