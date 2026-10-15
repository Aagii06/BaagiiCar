"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "users",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        profile: { type: Sequelize.STRING },
        username: { type: Sequelize.STRING },
        phonenumber: { type: Sequelize.STRING },
        firstname: { type: Sequelize.STRING },
        lastname: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        password: { type: Sequelize.STRING },
        forgot_pass_token: { type: Sequelize.STRING },
        forgot_pass_expire_date: { type: Sequelize.STRING },
        language: { type: Sequelize.STRING },
        role: { type: Sequelize.STRING },

        status: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        pass_changed_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
        pass_changed_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("users", ["phonenumber"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
