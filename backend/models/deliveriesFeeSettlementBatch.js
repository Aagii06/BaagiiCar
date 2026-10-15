const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class deliveriesFeeSettlementBatch extends Sequelize.Model {
    static associate({ deliveriesFeeSettlement, users }) {
      this.hasMany(deliveriesFeeSettlement, {
        as: "items",
        foreignKey: "settlement_batch_id",
      });

      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "confirmedBy", foreignKey: "confirmed_by" });
    }
  }

  deliveriesFeeSettlementBatch.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      total_count: { type: DataTypes.INTEGER },
      total_amount: { type: DataTypes.FLOAT },

      status: { type: DataTypes.STRING },
      confirmed_by: { type: DataTypes.INTEGER },
      confirmed_at: { type: DataTypes.STRING },

      created_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "deliveriesFeeSettlementBatch",
      modelName: "deliveriesFeeSettlementBatch",
      timestamps: false,
    },
  );

  return deliveriesFeeSettlementBatch;
};
