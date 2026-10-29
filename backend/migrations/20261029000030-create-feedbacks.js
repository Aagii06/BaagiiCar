"use strict";

// Вэбийн "Бидэнд бичих" маягтаар ирсэн санал хүсэлт. Админ самбарын Профайл → Санал хүсэлт-д харагдана.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "feedbacks",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        // Нэвтэрсэн зочин бол
        customer_id: {
          type: Sequelize.INTEGER,
          references: { model: "customers", key: "id" },
          onDelete: "SET NULL",
        },
        name: { type: Sequelize.STRING },
        phonenumber: { type: Sequelize.STRING(20) },
        email: { type: Sequelize.STRING },
        message: { type: Sequelize.TEXT, allowNull: false },
        // new - шинэ, seen - уншсан
        status: { type: Sequelize.STRING(10), defaultValue: "new" },

        created_at: { type: Sequelize.STRING },
        updated_by: { type: Sequelize.INTEGER },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("feedbacks", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("feedbacks");
  },
};
