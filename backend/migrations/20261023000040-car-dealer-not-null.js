"use strict";

// 20261023000030 ажиллахад cars.dealer_id-ийн NOT NULL тавигдаагүй (FK л нэмэгдсэн) тул нөхөж тавина.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [[{ n }]] = await queryInterface.sequelize.query("SELECT COUNT(*) n FROM cars WHERE dealer_id IS NULL");
    if (n > 0) throw new Error(`Дилергүй ${n} зар байна — эхлээд дилерт хуваарилна уу`);
    await queryInterface.sequelize.query("ALTER TABLE cars MODIFY dealer_id INT NOT NULL");
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("ALTER TABLE cars MODIFY dealer_id INT NULL");
  },
};
