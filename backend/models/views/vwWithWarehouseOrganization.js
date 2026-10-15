const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class vwWithWarehouseOrganization extends Sequelize.Model {
    static associate({ users }) {
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  vwWithWarehouseOrganization.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      type: { type: DataTypes.STRING },
      register: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },

      is_warehouse: { type: DataTypes.TINYINT },
      warehouse_start_date: { type: DataTypes.STRING },
      warehouse_expired_date: { type: DataTypes.STRING },

      status: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "vwWithWarehouseOrganization",
      modelName: "vwWithWarehouseOrganization",
      timestamps: false,
    },
  );

  return vwWithWarehouseOrganization;
};
