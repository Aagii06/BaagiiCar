"use strict";

// Вэбийн чатын мессежийн төрөл: "car" - зартай холбоотой (админ / дилер хариулна), "ai" - AI туслахтай яриа.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("messages", "type", {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: "car",
      after: "id",
    });
    await queryInterface.addIndex("messages", ["type"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("messages", ["type"]);
    await queryInterface.removeColumn("messages", "type");
  },
};
