"use strict";

// Брэнд бүрийн идэвхтэй зарын тоо (апп-ын CarBrand.count)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vwBrands'",
    );
    if (existing.length) return;

    await queryInterface.sequelize.query(`
      CREATE VIEW vwBrands AS
      SELECT
        b.id, b.name, b.country, b.logo, b.sort_order, b.status,
        (
          SELECT COUNT(*) FROM cars c
          WHERE c.brand_id = b.id AND c.status = 'active'
        ) AS car_count
      FROM brands b
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP VIEW IF EXISTS vwBrands");
  },
};
