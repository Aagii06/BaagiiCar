"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "deliveries",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

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

        delivery_fee: { type: Sequelize.FLOAT, defaultValue: 6000 },

        refund_by: { type: Sequelize.INTEGER },
        refund_at: { type: Sequelize.STRING },

        // Барааны (COD) тооцоо - харилцагчид буцаах бэлэн мөнгөний тооцоо
        is_settled: { type: Sequelize.TINYINT, defaultValue: false },
        settled_by: { type: Sequelize.INTEGER },
        settled_at: { type: Sequelize.STRING },

        // Хүргэлтийн тооцоо - харилцагчаас авах хүргэлтийн хураамжийн тооцоо
        is_fee_settled: { type: Sequelize.TINYINT, defaultValue: false },
        fee_settled_by: { type: Sequelize.INTEGER },
        fee_settled_at: { type: Sequelize.STRING },

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
    await queryInterface.dropTable("deliveries");
  },
};
