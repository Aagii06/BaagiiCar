"use strict";

// 20261026000010 нь vwDealers аль хэдийн байвал алгасдаг байсан тул хуучин
// (id, name, phonenumber, logo, car_count) view хэвээр үлдсэн. Энд дахин үүсгэнэ.
// Админы дилерийн жагсаалт: бүх дилер + устгагдаагүй зарын тоо

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW vwDealers AS
      SELECT
        d.id, d.name, d.logo, d.phonenumber, d.email, d.address, d.description,
        d.status, d.created_at,
        (
          SELECT COUNT(*) FROM cars c
          WHERE c.dealer_id = d.id AND c.status <> 'deleted'
        ) AS car_count
      FROM dealers d
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW vwDealers AS
      SELECT * FROM (
        SELECT
          d.id, d.name, d.phonenumber, d.logo,
          (SELECT COUNT(*) FROM cars c WHERE c.dealer_id = d.id AND c.status = 'active') AS car_count
        FROM dealers d
        WHERE d.status = 'active'
      ) x
      WHERE x.car_count > 0
    `);
  },
};
