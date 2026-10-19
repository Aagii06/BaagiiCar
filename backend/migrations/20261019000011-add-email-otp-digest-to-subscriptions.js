"use strict";

// Имэйл бүртгэлийг OTP-оор баталгаажуулж, шинэ заруудыг тогтмол хугацаанд нэгтгэн илгээхэд
// Имэйл бүртгэл баталгаажтал status = "pending"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("subscriptions", "otp_hash", { type: Sequelize.STRING(64) });
    await queryInterface.addColumn("subscriptions", "otp_expires_at", { type: Sequelize.STRING });
    await queryInterface.addColumn("subscriptions", "otp_sent_at", { type: Sequelize.STRING });
    await queryInterface.addColumn("subscriptions", "otp_attempts", { type: Sequelize.INTEGER, defaultValue: 0 });
    // Сүүлд илгээсэн digest-д орсон хамгийн их cars.id; үүнээс хойших зарыг дараагийн удаа илгээнэ
    await queryInterface.addColumn("subscriptions", "last_car_id", { type: Sequelize.INTEGER, defaultValue: 0 });
    await queryInterface.addColumn("subscriptions", "last_sent_at", { type: Sequelize.STRING });
  },

  async down(queryInterface) {
    for (const column of ["otp_hash", "otp_expires_at", "otp_sent_at", "otp_attempts", "last_car_id", "last_sent_at"])
      await queryInterface.removeColumn("subscriptions", column);
  },
};
