const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class carModels extends Sequelize.Model {
    static associate({ brands, cars, users }) {
      this.belongsTo(brands, { as: "brand", foreignKey: "brand_id" });
      this.hasMany(cars, { as: "cars", foreignKey: "car_model_id" });
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  carModels.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      brand_id: { type: DataTypes.INTEGER },
      name: { type: DataTypes.STRING },

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
      tableName: "carModels",
      modelName: "carModels",
      timestamps: false,
    },
  );

  carModels.softDelete = true;

  return carModels;
};
