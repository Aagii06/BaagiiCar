"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "carModels",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        brand_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "brands", key: "id" },
        },
        name: { type: Sequelize.STRING, allowNull: false },

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
    await queryInterface.dropTable("carModels");
  },
};
