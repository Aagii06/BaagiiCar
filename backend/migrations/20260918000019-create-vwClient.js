"use strict";

// TODO: Бодит DB дээрх view-ийн тодорхойлолтоос (SHOW CREATE VIEW vwClient) таамаглан бичсэн.
// name_and_phone-ийн формат болон нөхцөлийг шалгаж тааруулна уу.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Хүснэгтүүдийн CREATE TABLE IF NOT EXISTS-тэй адил: view байвал дарж бичихгүй
    const [existing] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vwClient'",
    );
    if (existing.length) return;

    await queryInterface.sequelize.query(`
      CREATE VIEW vwClient AS
      SELECT
        id, profile, organization_id, zone_id, username, phonenumber,
        firstname, lastname, email, password, forgot_pass_token,
        forgot_pass_expire_date, language, role,
        status, created_by, updated_by, deleted_by,
        created_at, updated_at, deleted_at,
        CONCAT_WS(' - ', firstname, phonenumber) AS name_and_phone
      FROM users
      WHERE role = 'Харилцагч'
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP VIEW IF EXISTS vwClient");
  },
};
