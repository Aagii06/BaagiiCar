"use strict";

// Дилер 5 хүртэл утасны дугаартай: phonenumbers = JSON массив (["99112233", ...]).
// dealers.phonenumber нь эхний (анх бүртгэсэн) дугаар хэвээр үлдэнэ (вэб, хайлт, vwDealers).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("dealers", "phonenumbers", { type: Sequelize.TEXT, after: "phonenumber" });
    await queryInterface.sequelize.query(`
      UPDATE dealers SET phonenumbers = JSON_ARRAY(phonenumber)
      WHERE phonenumber IS NOT NULL AND phonenumber <> ''
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("dealers", "phonenumbers");
  },
};
