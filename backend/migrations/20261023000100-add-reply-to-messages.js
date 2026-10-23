"use strict";

// Мессежийн хариу: админ / дилер admin панелаас бичнэ, хэрэглэгч вэбийн чат цонхондоо харна.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("messages", "reply", { type: Sequelize.TEXT, after: "message" });
    await queryInterface.addColumn("messages", "replied_by", { type: Sequelize.INTEGER, after: "reply" });
    await queryInterface.addColumn("messages", "replied_at", { type: Sequelize.STRING, after: "replied_by" });
    await queryInterface.addIndex("messages", ["created_by", "car_id"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("messages", ["created_by", "car_id"]);
    await queryInterface.removeColumn("messages", "replied_at");
    await queryInterface.removeColumn("messages", "replied_by");
    await queryInterface.removeColumn("messages", "reply");
  },
};
