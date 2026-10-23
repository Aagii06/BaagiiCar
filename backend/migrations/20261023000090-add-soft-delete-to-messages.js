"use strict";

// Мессежийг баазаас устгахгүй, status = "deleted" болгоно (админд "Устгагдсан" табаар харагдана).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("messages", "deleted_by", { type: Sequelize.INTEGER, after: "updated_by" });
    await queryInterface.addColumn("messages", "deleted_at", { type: Sequelize.STRING, after: "updated_at" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("messages", "deleted_at");
    await queryInterface.removeColumn("messages", "deleted_by");
  },
};
