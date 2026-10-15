"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "brands",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        name: { type: Sequelize.STRING, allowNull: false },
        country: { type: Sequelize.STRING },
        logo: { type: Sequelize.STRING },
        sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },

        status: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("brands");
  },
};
