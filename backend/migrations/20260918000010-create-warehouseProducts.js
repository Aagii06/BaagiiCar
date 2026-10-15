"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "warehouseProducts",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        organization_id: { type: Sequelize.INTEGER },
        organization_status: { type: Sequelize.STRING },
        image: { type: Sequelize.STRING },
        code: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        comment: { type: Sequelize.STRING },
        quantity: { type: Sequelize.FLOAT },
        price: { type: Sequelize.FLOAT },

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
    await queryInterface.dropTable("warehouseProducts");
  },
};
