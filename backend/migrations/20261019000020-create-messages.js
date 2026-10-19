"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "messages",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        // Вэбийн чат цонхноос ирсэн зочны мессеж (нэвтрэлтгүй)
        name: { type: Sequelize.STRING(100) },
        phonenumber: { type: Sequelize.STRING(20), allowNull: false },
        message: { type: Sequelize.TEXT, allowNull: false },
        car_id: {
          type: Sequelize.INTEGER,
          references: { model: "cars", key: "id" },
          onDelete: "SET NULL",
        },
        page_url: { type: Sequelize.STRING(500) },

        // new → done (админ хариулсны дараа)
        status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "new" },

        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("messages", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("messages");
  },
};
