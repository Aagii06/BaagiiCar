"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "subscriptions",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        // "email" эсвэл "push"
        kind: { type: Sequelize.STRING(10), allowNull: false },

        email: { type: Sequelize.STRING(254) },

        // Хөтчийн push subscription; endpoint урт тул unique-ийг hash дээр тавина
        endpoint: { type: Sequelize.TEXT },
        endpoint_hash: { type: Sequelize.STRING(64) },
        p256dh: { type: Sequelize.STRING(255) },
        auth: { type: Sequelize.STRING(255) },

        // Имэйлийн "бүртгэлээс гарах" холбоост ашиглана
        token: { type: Sequelize.STRING(64), allowNull: false },
        status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "active" },

        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("subscriptions", ["email"], { unique: true });
    await queryInterface.addIndex("subscriptions", ["endpoint_hash"], { unique: true });
    await queryInterface.addIndex("subscriptions", ["token"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("subscriptions");
  },
};
