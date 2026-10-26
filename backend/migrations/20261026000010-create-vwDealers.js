"use strict";

// Дилер бүрийн устгагдаагүй зарын тоо (админы дилерийн жагсаалт)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vwDealers'",
    );
    if (existing.length) return;

    await queryInterface.sequelize.query(`
      CREATE VIEW vwDealers AS
      SELECT
        d.id, d.name, d.logo, d.phonenumber, d.email, d.address, d.description,
        d.status, d.created_at,
        (
          SELECT COUNT(*) FROM cars c
          WHERE c.dealer_id = d.id AND c.status <> 'deleted'
        ) AS car_count
      FROM dealers d
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP VIEW IF EXISTS vwDealers");
  },
};
