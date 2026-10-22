"use strict";

// Зар заавал дилертэй: дилергүй зарыг идэвхтэй дилерүүдэд ээлжлэн тэнцүү хуваарилж,
// cars.dealer_id-г NOT NULL + dealers руу FK болгоно.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements });

    const [dealers] = await q("SELECT id FROM dealers WHERE status = 'active' ORDER BY id");
    const [orphans] = await q("SELECT id FROM cars WHERE dealer_id IS NULL ORDER BY id");
    if (orphans.length && !dealers.length) throw new Error("Идэвхтэй дилер алга — дилергүй зарыг хуваарилах боломжгүй");

    for (const [i, { id }] of orphans.entries())
      await q("UPDATE cars SET dealer_id = ? WHERE id = ?", [dealers[i % dealers.length].id, id]);

    await queryInterface.changeColumn("cars", "dealer_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "dealers", key: "id" },
      onDelete: "RESTRICT",
    });
  },

  // Хуваарилалтыг буцаахгүй — зөвхөн шаардлагыг авна
  async down(queryInterface, Sequelize) {
    const [fks] = await queryInterface.sequelize.query(
      `SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cars' AND COLUMN_NAME = 'dealer_id' AND REFERENCED_TABLE_NAME = 'dealers'`,
    );
    for (const { name } of fks) await queryInterface.removeConstraint("cars", name);
    await queryInterface.changeColumn("cars", "dealer_id", { type: Sequelize.INTEGER, allowNull: true });
  },
};
