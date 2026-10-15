"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "districtToZone",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        district_id: { type: Sequelize.INTEGER },
        zone_id: { type: Sequelize.INTEGER },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("districtToZone");
  },
};
