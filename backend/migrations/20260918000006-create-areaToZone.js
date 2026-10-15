"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "areaToZone",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        area_id: { type: Sequelize.INTEGER },
        zone_id: { type: Sequelize.INTEGER },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("areaToZone");
  },
};
