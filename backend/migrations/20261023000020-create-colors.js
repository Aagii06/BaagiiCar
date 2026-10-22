"use strict";

// Машины өнгөний жагсаалт: type = "exterior" (гадна) эсвэл "interior" (дотор / салон).
// Зарын cars.color / cars.interior_color-д сонгосон өнгөний name_mn хадгалагдана.

const exterior = [
  ["Цагаан", "White", "#FFFFFF"],
  ["Сувдан цагаан", "Pearl White", "#F4F1EA"],
  ["Хар", "Black", "#000000"],
  ["Мөнгөлөг", "Silver", "#C0C0C0"],
  ["Саарал", "Gray", "#808080"],
  ["Хар саарал", "Dark Gray", "#4A4A4A"],
  ["Улаан", "Red", "#C8102E"],
  ["Хүрэн улаан", "Maroon", "#800000"],
  ["Цэнхэр", "Blue", "#1E5AA8"],
  ["Хар хөх", "Navy Blue", "#1B2A49"],
  ["Цайвар хөх", "Light Blue", "#87CEEB"],
  ["Ногоон", "Green", "#2E7D32"],
  ["Хаки", "Khaki / Olive", "#6B6B3A"],
  ["Шар", "Yellow", "#F4C430"],
  ["Улбар шар", "Orange", "#F57C00"],
  ["Бор", "Brown", "#6D4C41"],
  ["Шаргал", "Beige", "#D8C8A8"],
  ["Алтлаг", "Gold", "#C9A13B"],
  ["Нил ягаан", "Purple", "#6A1B9A"],
  ["Ягаан", "Pink", "#E91E63"],
  ["Хоёр өнгөтэй", "Two-tone", null],
  ["Бусад", "Other", null],
];

const interior = [
  ["Хар", "Black", "#000000"],
  ["Саарал", "Gray", "#808080"],
  ["Хар саарал", "Charcoal", "#36454F"],
  ["Шаргал", "Beige", "#D8C8A8"],
  ["Цөцгий", "Cream / Ivory", "#F3E9D2"],
  ["Цагаан", "White", "#FFFFFF"],
  ["Бор", "Brown", "#6D4C41"],
  ["Цайвар бор", "Tan / Camel", "#C19A6B"],
  ["Улаан", "Red", "#B22222"],
  ["Хүрэн улаан", "Burgundy", "#800020"],
  ["Цэнхэр", "Blue", "#1E3A5F"],
  ["Хоёр өнгөтэй", "Two-tone", null],
  ["Бусад", "Other", null],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "colors",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        type: { type: Sequelize.STRING(10), allowNull: false },
        name_mn: { type: Sequelize.STRING(50), allowNull: false },
        name_en: { type: Sequelize.STRING(50) },
        // null: "Хоёр өнгөтэй", "Бусад"
        hex: { type: Sequelize.STRING(7) },
        sort_order: { type: Sequelize.INTEGER },

        status: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("colors", ["type", "name_mn"], { unique: true });

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const rows = (type, list) =>
      list.map(([name_mn, name_en, hex], i) => ({ type, name_mn, name_en, hex, sort_order: i + 1, status: "active", created_at: now }));
    await queryInterface.bulkInsert("colors", [...rows("exterior", exterior), ...rows("interior", interior)]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("colors");
  },
};
