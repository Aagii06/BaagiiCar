const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class deliveriesSettlement extends Sequelize.Model {
    static associate({
      deliveries,
      deliveriesSettlementBatch,
      organizations,
      zones,
      users,
      vwDriver,
    }) {
      this.belongsTo(deliveries, {
        as: "delivery",
        foreignKey: "delivery_id",
      });

      this.belongsTo(deliveriesSettlementBatch, {
        as: "settlementBatch",
        foreignKey: "settlement_batch_id",
      });

      this.belongsTo(organizations, {
        as: "organization",
        foreignKey: "organization_id",
      });
      this.belongsTo(zones, { as: "zone", foreignKey: "zone_id" });

      this.belongsTo(vwDriver, { as: "receiveBy", foreignKey: "receive_by" });
      this.belongsTo(users, { as: "confirmBy", foreignKey: "confirm_by" });
      this.belongsTo(vwDriver, { as: "allocateBy", foreignKey: "allocate_by" });
      this.belongsTo(vwDriver, { as: "allocateTo", foreignKey: "allocate_to" });
      this.belongsTo(vwDriver, { as: "deliveryBy", foreignKey: "delivery_by" });

      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
      this.belongsTo(users, { as: "settledBy", foreignKey: "settled_by" });
    }
  }

  deliveriesSettlement.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      delivery_id: { type: DataTypes.INTEGER },
      settlement_batch_id: { type: DataTypes.INTEGER },

      organization_id: { type: DataTypes.INTEGER },
      zone_id: { type: DataTypes.INTEGER },

      image: { type: DataTypes.STRING },
      code: { type: DataTypes.STRING },
      title: { type: DataTypes.STRING },
      product_name: { type: DataTypes.STRING },
      product_code: { type: DataTypes.STRING },
      is_paid: { type: DataTypes.TINYINT },
      paid_amount: { type: DataTypes.FLOAT },
      phonenumber: { type: DataTypes.STRING },
      phonenumber2: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },
      comment: { type: DataTypes.STRING },

      created_type: { type: DataTypes.STRING },
      status: { type: DataTypes.STRING },

      receive_by: { type: DataTypes.INTEGER },
      receive_at: { type: DataTypes.STRING },

      confirm_by: { type: DataTypes.INTEGER },
      confirm_at: { type: DataTypes.STRING },
      confirm_notes: { type: DataTypes.STRING },
      confirm_cause: { type: DataTypes.STRING },
      confirm_cause_other: { type: DataTypes.STRING },

      allocate_by: { type: DataTypes.INTEGER },
      allocate_to: { type: DataTypes.INTEGER },
      allocate_at: { type: DataTypes.STRING },

      delivery_by: { type: DataTypes.INTEGER },
      delivery_at: { type: DataTypes.STRING },
      delivery_cause: { type: DataTypes.STRING },
      delivery_cause_other: { type: DataTypes.STRING },
      delivery_after: { type: DataTypes.STRING },
      delivery_after_other: { type: DataTypes.STRING },
      delivery_fee: { type: DataTypes.FLOAT },

      refund_by: { type: DataTypes.INTEGER },
      refund_at: { type: DataTypes.STRING },

      settled_by: { type: DataTypes.INTEGER },
      settled_at: { type: DataTypes.STRING },

      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "deliveriesSettlement",
      modelName: "deliveriesSettlement",
      timestamps: false,
    },
  );

  return deliveriesSettlement;
};
