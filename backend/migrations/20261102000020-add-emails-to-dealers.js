"use strict";

// Дилер 5 хүртэл и-мэйлтэй: emails = JSON массив, утасны дугаартай адил (20261102000010).
// dealers.email нь эхний (үндсэн) и-мэйл хэвээр үлдэнэ.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("dealers", "emails", { type: Sequelize.TEXT, after: "email" });
    await queryInterface.sequelize.query(`
      UPDATE dealers SET emails = JSON_ARRAY(email)
      WHERE email IS NOT NULL AND email <> ''
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("dealers", "emails");
  },
};
