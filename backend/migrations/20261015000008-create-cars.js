"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "cars",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        brand_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "brands", key: "id" },
        },
        car_model_id: {
          type: Sequelize.INTEGER,
          references: { model: "carModels", key: "id" },
        },
        body_type_id: {
          type: Sequelize.INTEGER,
          references: { model: "bodyTypes", key: "id" },
        },
        location_id: {
          type: Sequelize.INTEGER,
          references: { model: "locations", key: "id" },
        },
        manufactured_year: { type: Sequelize.INTEGER }, // Үйлдвэрлэсэн он
        imported_year: { type: Sequelize.INTEGER }, // Орж ирсэн он
        price: { type: Sequelize.BIGINT }, // ₮
        mileage: { type: Sequelize.INTEGER }, // км
        fuel_type: { type: Sequelize.STRING },
        transmission: { type: Sequelize.STRING },
        drive_type: { type: Sequelize.STRING },
        steering: { type: Sequelize.STRING },
        engine_capacity: { type: Sequelize.DECIMAL(4, 1) }, // литр
        color: { type: Sequelize.STRING },
        vin: { type: Sequelize.STRING },
        phonenumber: { type: Sequelize.STRING },
        description: { type: Sequelize.TEXT },
        view_count: { type: Sequelize.INTEGER, defaultValue: 0 },
        is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },
        sold_at: { type: Sequelize.STRING },

        status: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("cars", ["status", "created_at"]);
    await queryInterface.addIndex("cars", ["price"]);
    await queryInterface.addIndex("cars", ["manufactured_year"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("cars");
  },
};
