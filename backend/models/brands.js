const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class brands extends Sequelize.Model {
    static associate({ carModels, cars, users }) {
      this.hasMany(carModels, { as: "carModels", foreignKey: "brand_id" });
      this.hasMany(cars, { as: "cars", foreignKey: "brand_id" });
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  brands.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING },
      country: { type: DataTypes.STRING },
      logo: { type: DataTypes.STRING },
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
      tableName: "brands",
      modelName: "brands",
      timestamps: false,
    },
  );

  brands.softDelete = true;

  return brands;
};
