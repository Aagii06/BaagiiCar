"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "deliveriesFeeSettlementBatch",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        total_count: { type: Sequelize.INTEGER },
        total_amount: { type: Sequelize.FLOAT },

        status: { type: Sequelize.STRING },
        confirmed_by: { type: Sequelize.INTEGER },
        confirmed_at: { type: Sequelize.STRING },

        created_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("deliveriesFeeSettlementBatch");
  },
};
