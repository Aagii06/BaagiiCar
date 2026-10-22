"use strict";

// Хуучин урт (YYYYMMDDHHmmss + 8 орон) зарын дугаарыг YYYYMMDD + 4 оронтой болгоно.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id, DATE_FORMAT(COALESCE(created_at, NOW()), '%Y%m%d') AS day FROM cars WHERE code IS NULL OR LENGTH(code) <> 12",
    );
    const [kept] = await queryInterface.sequelize.query("SELECT code FROM cars WHERE LENGTH(code) = 12");
    const used = new Set(kept.map((r) => r.code));
    for (const { id, day } of rows) {
      let code;
      do code = day + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
      while (used.has(code));
      used.add(code);
      await queryInterface.sequelize.query("UPDATE cars SET code = ? WHERE id = ?", { replacements: [code, id] });
    }
    await queryInterface.changeColumn("cars", "code", { type: Sequelize.STRING(12) });
  },

  // Богино дугаарыг буцааж уртасгах боломжгүй — зөвхөн баганын уртыг сэргээнэ
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("cars", "code", { type: Sequelize.STRING(22) });
  },
};
