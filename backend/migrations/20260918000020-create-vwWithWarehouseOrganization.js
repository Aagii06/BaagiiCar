"use strict";

// TODO: Бодит DB дээрх view-ийн тодорхойлолтоос (SHOW CREATE VIEW vwWithWarehouseOrganization)
// таамаглан бичсэн. Нөхцөлийг шалгаж тааруулна уу.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Хүснэгтүүдийн CREATE TABLE IF NOT EXISTS-тэй адил: view байвал дарж бичихгүй
    const [existing] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vwWithWarehouseOrganization'",
    );
    if (existing.length) return;

    await queryInterface.sequelize.query(`
      CREATE VIEW vwWithWarehouseOrganization AS
      SELECT
        id, type, register, name, phonenumber, address, description,
        is_warehouse, warehouse_start_date, warehouse_expired_date,
        status, created_by, updated_by, deleted_by,
        created_at, updated_at, deleted_at
      FROM organizations
      WHERE is_warehouse = 1
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DROP VIEW IF EXISTS vwWithWarehouseOrganization",
    );
  },
};
