"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "deliveriesSettlement",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        delivery_id: { type: Sequelize.INTEGER },
        settlement_batch_id: { type: Sequelize.INTEGER },

        organization_id: { type: Sequelize.INTEGER },
        zone_id: { type: Sequelize.INTEGER },

        image: { type: Sequelize.STRING },
        code: { type: Sequelize.STRING },
        title: { type: Sequelize.STRING },
        product_name: { type: Sequelize.STRING },
        product_code: { type: Sequelize.STRING },
        is_paid: { type: Sequelize.TINYINT },
        paid_amount: { type: Sequelize.FLOAT },
        phonenumber: { type: Sequelize.STRING },
        phonenumber2: { type: Sequelize.STRING },
        address: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING },
        comment: { type: Sequelize.STRING },

        created_type: { type: Sequelize.STRING },
        status: { type: Sequelize.STRING },

        receive_by: { type: Sequelize.INTEGER },
        receive_at: { type: Sequelize.STRING },

        confirm_by: { type: Sequelize.INTEGER },
        confirm_at: { type: Sequelize.STRING },
        confirm_notes: { type: Sequelize.STRING },
        confirm_cause: { type: Sequelize.STRING },
        confirm_cause_other: { type: Sequelize.STRING },

        allocate_by: { type: Sequelize.INTEGER },
        allocate_to: { type: Sequelize.INTEGER },
        allocate_at: { type: Sequelize.STRING },

        delivery_by: { type: Sequelize.INTEGER },
        delivery_at: { type: Sequelize.STRING },
        delivery_cause: { type: Sequelize.STRING },
        delivery_cause_other: { type: Sequelize.STRING },
        delivery_after: { type: Sequelize.STRING },
        delivery_after_other: { type: Sequelize.STRING },
        delivery_fee: { type: Sequelize.FLOAT },

        refund_by: { type: Sequelize.INTEGER },
        refund_at: { type: Sequelize.STRING },

        settled_by: { type: Sequelize.INTEGER },
        settled_at: { type: Sequelize.STRING },

        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("deliveriesSettlement");
  },
};
