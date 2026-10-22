"use strict";

// Имэйлээр илгээх нэг удаагийн код (helper/otpHelper.js)
// Нэг имэйл + зорилго (purpose) бүрт нэг мөр: шинэ код авахад дарж бичнэ, амжилттай шалгасны дараа устгана

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "email_otps",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        email: { type: Sequelize.STRING(254), allowNull: false },
        // "login" гэх мэт
        purpose: { type: Sequelize.STRING(20), allowNull: false },

        // Кодыг шууд хадгалахгүй, HMAC-SHA256
        otp_hash: { type: Sequelize.STRING(64), allowNull: false },
        expires_at: { type: Sequelize.STRING },
        sent_at: { type: Sequelize.STRING },
        attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },

        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("email_otps", ["email", "purpose"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("email_otps");
  },
};
