const Sequelize = require("sequelize");

// Машины өнгө: type = "exterior" (гадна) | "interior" (дотор / салон)
module.exports = (sequelize, DataTypes) => {
  class colors extends Sequelize.Model {
    static associate({ users }) {
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  colors.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      type: { type: DataTypes.STRING(10) },
      name_mn: { type: DataTypes.STRING(50) },
      name_en: { type: DataTypes.STRING(50) },
      hex: { type: DataTypes.STRING(7) },
      sort_order: { type: DataTypes.INTEGER },

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
      tableName: "colors",
      modelName: "colors",
      timestamps: false,
    },
  );

  colors.softDelete = true;

  return colors;
};
