"use strict";

// Улаанбаатар + 21 аймаг, үсгийн дарааллаар. Байгаа нэрийг дахин нэмэхгүй (id хэвээр), зөвхөн sort_order-ийг шинэчилнэ.
const locations = [
  "Архангай",
  "Баян-Өлгий",
  "Баянхонгор",
  "Булган",
  "Говь-Алтай",
  "Говьсүмбэр",
  "Дархан-Уул",
  "Дорноговь",
  "Дорнод",
  "Дундговь",
  "Завхан",
  "Орхон",
  "Өвөрхангай",
  "Өмнөговь",
  "Сүхбаатар",
  "Сэлэнгэ",
  "Төв",
  "Увс",
  "Улаанбаатар",
  "Ховд",
  "Хөвсгөл",
  "Хэнтий",
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query("SELECT name FROM locations");
    const existing = new Set(rows.map((r) => r.name));

    const missing = locations
      .map((name, i) => ({ name, sort_order: i + 1, status: "active", created_at: "2026-10-19 00:00:00" }))
      .filter((r) => !existing.has(r.name));
    if (missing.length) await queryInterface.bulkInsert("locations", missing);

    for (const [i, name] of locations.entries()) {
      await queryInterface.bulkUpdate("locations", { sort_order: i + 1 }, { name });
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("locations", { name: locations });
  },
};
