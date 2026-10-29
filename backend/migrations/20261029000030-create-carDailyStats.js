"use strict";

// Зар бүрийн өдөр тутмын үзсэн / дугаар харсан тоо (Самбарын "Өнөөдөр хамгийн их ..." жагсаалтад).
// helper/carViewHelper.js тоолох бүрт нэмнэ. vwCarDailyStats-д зарын мэдээлэлтэй нийлүүлнэ.

const vwSql = `
  CREATE OR REPLACE VIEW vwCarDailyStats AS
  SELECT
    s.id, s.car_id, s.date, s.view_count AS day_view_count, s.phone_view_count AS day_phone_view_count,
    c.code, c.user_id, c.dealer_id, c.status, c.price, c.manufactured_year, c.imported_year,
    c.phonenumber, c.view_count, c.phone_view_count,
    c.name, c.brand_name, c.model_name, c.body_type_name, c.seller_name, c.dealer_name, c.image
  FROM carDailyStats s
  JOIN vwCars c ON c.id = s.car_id
`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "carDailyStats",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        car_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "cars", key: "id" },
          onDelete: "CASCADE",
        },
        // Улаанбаатарын цагаар "YYYY-MM-DD"
        date: { type: Sequelize.STRING(10), allowNull: false },
        view_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        phone_view_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("carDailyStats", ["car_id", "date"], { unique: true });
    await queryInterface.addIndex("carDailyStats", ["date"]);
    await queryInterface.sequelize.query(vwSql);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP VIEW IF EXISTS vwCarDailyStats");
    await queryInterface.dropTable("carDailyStats");
  },
};
