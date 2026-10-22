"use strict";

// Вэб дээр харагдах дилерүүд: идэвхтэй DEALER, идэвхтэй зартай (car_count > 0).
// Дилерийн машин = дилерт хамаарах (user_id) эсвэл дилерийн өөрийн оруулсан (created_by)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW vwDealers AS
      SELECT * FROM (
        SELECT
          u.id, u.firstname, u.lastname, u.phonenumber, u.logo,
          (
            SELECT COUNT(*) FROM cars c
            WHERE (c.user_id = u.id OR c.created_by = u.id) AND c.status = 'active'
          ) AS car_count
        FROM users u
        WHERE u.role = 'DEALER' AND u.status = 'active'
      ) d
      WHERE d.car_count > 0
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP VIEW IF EXISTS vwDealers");
  },
};
