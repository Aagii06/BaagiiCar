"use strict";

// Дилер хэдэн ч салбар хаягтай байж болно: addresses = JSON массив (20261102000010-тай адил).
// dealers.address нь эхний (үндсэн) хаяг хэвээр үлдэнэ.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("dealers", "addresses", { type: Sequelize.TEXT, after: "address" });
    await queryInterface.sequelize.query(`
      UPDATE dealers SET addresses = JSON_ARRAY(address)
      WHERE address IS NOT NULL AND address <> ''
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("dealers", "addresses");
  },
};
