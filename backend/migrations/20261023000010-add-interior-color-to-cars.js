"use strict";

// Зарын дотор (салоны) өнгө: cars.interior_color, vwCars-д нэмнэ.

const vwCarsSql = (withInterior) => `
  CREATE OR REPLACE VIEW vwCars AS
  SELECT
    c.id, c.code, c.user_id, c.dealer_id, c.brand_id, c.car_model_id, c.body_type_id, c.location_id,
    c.manufactured_year, c.imported_year, c.price, c.mileage,
    c.fuel_type, c.transmission, c.drive_type, c.steering,
    c.engine_capacity, c.color,${withInterior ? " c.interior_color," : ""} c.vin, c.phonenumber, c.description,
    c.view_count, c.is_featured, c.sold_at,
    c.reject_reason, c.rejected_at,
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
    d.name AS dealer_name,
    d.logo AS dealer_logo,
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
  LEFT JOIN dealers d ON d.id = c.dealer_id AND d.status <> 'deleted'
`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("cars", "interior_color", { type: Sequelize.STRING, after: "color" });
    await queryInterface.sequelize.query(vwCarsSql(true));
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(vwCarsSql(false));
    await queryInterface.removeColumn("cars", "interior_color");
  },
};
