"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "organizations",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        logo: { type: Sequelize.STRING },
        type: { type: Sequelize.STRING },
        register: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        phonenumber: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        address: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING },

        is_warehouse: { type: Sequelize.TINYINT },
        warehouse_start_date: { type: Sequelize.STRING },
        warehouse_expired_date: { type: Sequelize.STRING },

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
    await queryInterface.dropTable("organizations");
  },
};
