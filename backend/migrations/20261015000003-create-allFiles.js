"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "allFiles",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        generated_name: { type: Sequelize.STRING },
        data_id: { type: Sequelize.INTEGER },
        object_name: { type: Sequelize.STRING },
        field_name: { type: Sequelize.STRING },
        extension: { type: Sequelize.STRING },
        size: { type: Sequelize.INTEGER },
        original_name: { type: Sequelize.STRING },
        order: { type: Sequelize.INTEGER },

        status: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    // vwCars-ийн нүүр зургийн subquery-д ашиглагдана
    await queryInterface.addIndex("allFiles", ["object_name", "data_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("allFiles");
  },
};
