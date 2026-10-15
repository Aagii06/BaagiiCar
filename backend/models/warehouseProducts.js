const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class warehouseProducts extends Sequelize.Model {
    static associate({ organizations, users }) {
      this.belongsTo(organizations, {
        as: "organization",
        foreignKey: "organization_id",
      });
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  warehouseProducts.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      organization_id: { type: DataTypes.INTEGER },
      organization_status: { type: DataTypes.STRING },
      image: { type: DataTypes.STRING },
      code: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      comment: { type: DataTypes.STRING },
      quantity: { type: DataTypes.FLOAT },
      price: { type: DataTypes.FLOAT },

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
      tableName: "warehouseProducts",
      modelName: "warehouseProducts",
      timestamps: false,
    }
  );

  warehouseProducts.softDelete = true;

  warehouseProducts.beforeSave(async (data, options) => {
    let errorMessage = "";
    if (errorMessage !== "") throw errorMessage;
  });

  return warehouseProducts;
};
