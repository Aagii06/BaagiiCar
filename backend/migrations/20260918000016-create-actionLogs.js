"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "actionLogs",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        object_name: { type: Sequelize.STRING },
        object_id: { type: Sequelize.INTEGER },
        log_action: { type: Sequelize.STRING },
        log_action_mn: { type: Sequelize.STRING },
        modify_data: { type: Sequelize.TEXT },

        created_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("actionLogs");
  },
};
