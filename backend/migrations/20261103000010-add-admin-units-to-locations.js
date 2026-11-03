"use strict";

// Байршлыг ҮСХ-ны засаг захиргааны нэгжээр шатлалтай болгоно: аймаг → сум/дүүрэг → баг/хороо.
// Байгаа аймгийн мөрүүд (cars.location_id заадаг) id-гаа хадгалж code/level авна; сум, баг шинээр нэмэгдэнэ.
const units = require("../seeders/data/mongolia_admin_units.json");

const createdAt = "2026-11-03 00:00:00";
const byName = (a, b) => a.name.localeCompare(b.name, "mn");
const byNumber = (a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || byName(a, b);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("locations", "parent_id", { type: Sequelize.INTEGER, after: "id" });
    await queryInterface.addColumn("locations", "level", { type: Sequelize.STRING, after: "parent_id" });
    await queryInterface.addColumn("locations", "code", { type: Sequelize.STRING, after: "level" });
    await queryInterface.addIndex("locations", ["parent_id"]);

    await queryInterface.sequelize.transaction(async (transaction) => {
      const ids = {};
      const [existing] = await queryInterface.sequelize.query("SELECT id, name FROM locations", { transaction });
      const [[{ maxSort }]] = await queryInterface.sequelize.query("SELECT COALESCE(MAX(sort_order), 0) AS maxSort FROM locations", {
        transaction,
      });
      for (const [i, aimag] of units.filter((u) => u.level === "aimag").entries()) {
        const row = existing.find((r) => r.name === aimag.name);
        if (row) {
          await queryInterface.bulkUpdate("locations", { level: "aimag", code: aimag.code }, { id: row.id }, { transaction });
          ids[aimag.code] = row.id;
        } else {
          await queryInterface.bulkInsert(
            "locations",
            [{ level: "aimag", code: aimag.code, name: aimag.name, sort_order: maxSort + i + 1, status: "active", created_at: createdAt }],
            { transaction },
          );
          const [[{ id }]] = await queryInterface.sequelize.query("SELECT LAST_INSERT_ID() AS id", { transaction });
          ids[aimag.code] = id;
        }
      }

      for (const [level, sorter] of [["soum", byName], ["bag", byNumber]]) {
        const groups = {};
        units.filter((u) => u.level === level).forEach((u) => (groups[u.parent_code] ||= []).push(u));
        const rows = Object.values(groups).flatMap((g) =>
          g.sort(sorter).map((u, i) => ({
            parent_id: ids[u.parent_code],
            level,
            code: u.code,
            name: u.name,
            sort_order: i + 1,
            status: "active",
            created_at: createdAt,
          })),
        );
        await queryInterface.bulkInsert("locations", rows, { transaction });
        const [inserted] = await queryInterface.sequelize.query("SELECT id, code FROM locations WHERE level = ?", {
          replacements: [level],
          transaction,
        });
        inserted.forEach((r) => (ids[r.code] = r.id));
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("locations", { level: ["soum", "bag"] });
    await queryInterface.removeIndex("locations", ["parent_id"]);
    await queryInterface.removeColumn("locations", "code");
    await queryInterface.removeColumn("locations", "level");
    await queryInterface.removeColumn("locations", "parent_id");
  },
};
