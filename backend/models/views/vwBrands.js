const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class vwBrands extends Sequelize.Model {}

  vwBrands.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING },
      country: { type: DataTypes.STRING },
      logo: { type: DataTypes.STRING },
      sort_order: { type: DataTypes.INTEGER },

      status: { type: DataTypes.STRING },

      car_count: { type: DataTypes.INTEGER },
    },
    {
      sequelize,
      tableName: "vwBrands",
      modelName: "vwBrands",
      timestamps: false,
    },
  );

  return vwBrands;
};
