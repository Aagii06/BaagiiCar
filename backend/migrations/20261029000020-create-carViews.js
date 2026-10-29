"use strict";

// Зар / утасны дугаар үзсэн бүртгэл: нэг хүн (customer_id эсвэл IP) 6 цагийн дотор дахин тоологдохгүй.
// 6 цагаас хуучин мөрийг helper/carViewHelper.js устгана.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "carViews",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        car_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "cars", key: "id" },
          onDelete: "CASCADE",
        },
        customer_id: { type: Sequelize.INTEGER },
        ip: { type: Sequelize.STRING(45) },
        // "view" - зар үзсэн, "phone" - дугаар харсан
        type: { type: Sequelize.STRING(10), allowNull: false },

        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("carViews", ["car_id", "type", "ip"]);
    await queryInterface.addIndex("carViews", ["car_id", "type", "customer_id"]);
    await queryInterface.addIndex("carViews", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("carViews");
  },
};
