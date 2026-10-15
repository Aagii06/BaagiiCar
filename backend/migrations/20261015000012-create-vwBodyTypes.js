"use strict";

// Биеийн төрөл бүрийн идэвхтэй зарын тоо (апп-ын CarBodyType.count)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vwBodyTypes'",
    );
    if (existing.length) return;

    await queryInterface.sequelize.query(`
      CREATE VIEW vwBodyTypes AS
      SELECT
        bt.id, bt.name, bt.image, bt.sort_order, bt.status,
        (
          SELECT COUNT(*) FROM cars c
          WHERE c.body_type_id = bt.id AND c.status = 'active'
        ) AS car_count
      FROM bodyTypes bt
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP VIEW IF EXISTS vwBodyTypes");
  },
};
