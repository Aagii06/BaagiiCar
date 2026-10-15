"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "favorites",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        car_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "cars", key: "id" },
          onDelete: "CASCADE",
        },

        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    // Нэг хэрэглэгч нэг машиныг нэг л удаа хадгална
    await queryInterface.addIndex("favorites", ["user_id", "car_id"], {
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("favorites");
  },
};
