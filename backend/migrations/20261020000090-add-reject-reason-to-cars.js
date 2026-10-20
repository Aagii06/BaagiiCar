"use strict";

// Админ хүлээгдэж буй зарыг тайлбартай буцаана (status = "rejected").
// Зарын эзэн засаад хадгалахад дахин "pending" болж хүсэлт илгээгдэнэ.

const viewSql = (extraColumns) => `
  CREATE OR REPLACE VIEW vwCars AS
  SELECT
    c.id, c.user_id, c.brand_id, c.car_model_id, c.body_type_id, c.location_id,
    c.manufactured_year, c.imported_year, c.price, c.mileage,
    c.fuel_type, c.transmission, c.drive_type, c.steering,
    c.engine_capacity, c.color, c.vin, c.phonenumber, c.description,
    c.view_count, c.is_featured, c.sold_at,${extraColumns}
    c.status, c.created_by, c.updated_by, c.deleted_by,
    c.created_at, c.updated_at, c.deleted_at,
    CONCAT_WS(' ', b.name, m.name, c.manufactured_year) AS name,
    b.name AS brand_name,
    b.logo AS brand_logo,
    m.name AS model_name,
    bt.name AS body_type_name,
    l.name AS location_name,
    CONCAT_WS(' ', u.lastname, u.firstname) AS seller_name,
    u.phonenumber AS seller_phone,
    (
      SELECT f.generated_name FROM allFiles f
      WHERE f.object_name = 'cars' AND f.data_id = c.id
        AND (f.status IS NULL OR f.status <> 'deleted')
      ORDER BY f.\`order\`, f.id
      LIMIT 1
    ) AS image,
    (
      SELECT COUNT(*) FROM allFiles f
      WHERE f.object_name = 'cars' AND f.data_id = c.id
        AND (f.status IS NULL OR f.status <> 'deleted')
    ) AS image_count,
    (SELECT COUNT(*) FROM favorites fv WHERE fv.car_id = c.id) AS favorite_count
  FROM cars c
  LEFT JOIN brands b ON b.id = c.brand_id
  LEFT JOIN carModels m ON m.id = c.car_model_id
  LEFT JOIN bodyTypes bt ON bt.id = c.body_type_id
  LEFT JOIN locations l ON l.id = c.location_id
  LEFT JOIN users u ON u.id = c.user_id
`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("cars", "reject_reason", { type: Sequelize.TEXT });
    await queryInterface.addColumn("cars", "rejected_by", { type: Sequelize.INTEGER });
    await queryInterface.addColumn("cars", "rejected_at", { type: Sequelize.STRING });
    await queryInterface.sequelize.query(viewSql("\n    c.reject_reason, c.rejected_at,"));
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(viewSql(""));
    for (const column of ["reject_reason", "rejected_by", "rejected_at"]) await queryInterface.removeColumn("cars", column);
  },
};
