"use strict";

// Хэрэглэгч хариуг уншсан огноо: messageReplies.read_at. Хоосон = уншаагүй (вэбийн "Мессеж"-ийн badge).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("messageReplies", "read_at", { type: Sequelize.STRING, after: "reply" });
    await queryInterface.addIndex("messageReplies", ["message_id", "read_at"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("messageReplies", ["message_id", "read_at"]);
    await queryInterface.removeColumn("messageReplies", "read_at");
  },
};
