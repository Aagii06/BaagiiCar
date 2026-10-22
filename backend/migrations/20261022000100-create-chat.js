"use strict";

// Зочин хэрэглэгч (customers) ба дилер/админ (users)-ын хоорондох чат.
// Нэг зочин нэг дилер/админтай нэг л яриатай; мессеж бүр аль зарын тухай болохыг car_id-аар заана.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "conversations",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        customer_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "customers", key: "id" },
          onDelete: "CASCADE",
        },
        // Хариулах дилер эсвэл админ
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        // Сүүлд ярьсан зар
        car_id: {
          type: Sequelize.INTEGER,
          references: { model: "cars", key: "id" },
          onDelete: "SET NULL",
        },
        last_message: { type: Sequelize.STRING(500) },
        last_message_at: { type: Sequelize.STRING },
        customer_unread: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        user_unread: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },

        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("conversations", ["customer_id", "user_id"], { unique: true });
    await queryInterface.addIndex("conversations", ["user_id"]);

    await queryInterface.createTable(
      "chat_messages",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        conversation_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "conversations", key: "id" },
          onDelete: "CASCADE",
        },
        // "customer" | "user"
        sender: { type: Sequelize.STRING(10), allowNull: false },
        sender_id: { type: Sequelize.INTEGER, allowNull: false },
        car_id: {
          type: Sequelize.INTEGER,
          references: { model: "cars", key: "id" },
          onDelete: "SET NULL",
        },
        body: { type: Sequelize.TEXT, allowNull: false },

        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("chat_messages", ["conversation_id", "id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("chat_messages");
    await queryInterface.dropTable("conversations");
  },
};
