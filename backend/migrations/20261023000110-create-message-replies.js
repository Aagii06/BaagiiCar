"use strict";

// Нэг мессежид олон хариу: messageReplies. Өмнөх messages.reply-г эхний хариу болгон шилжүүлнэ.
// messages.reply / replied_at нь хамгийн сүүлийн хариуг хадгалсаар (жагсаалтад хурдан харуулахад).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "messageReplies",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        message_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "messages", key: "id" },
          onDelete: "CASCADE",
        },
        reply: { type: Sequelize.TEXT, allowNull: false },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("messageReplies", ["message_id"]);
    await queryInterface.sequelize.query(`
      INSERT INTO messageReplies (message_id, reply, created_by, created_at)
      SELECT id, reply, replied_by, replied_at FROM messages WHERE reply IS NOT NULL AND reply <> ''
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("messageReplies");
  },
};
