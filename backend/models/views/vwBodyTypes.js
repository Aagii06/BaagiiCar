const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class vwBodyTypes extends Sequelize.Model {}

  vwBodyTypes.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING },
      image: { type: DataTypes.STRING },
      sort_order: { type: DataTypes.INTEGER },

      status: { type: DataTypes.STRING },

      car_count: { type: DataTypes.INTEGER },
    },
    {
      sequelize,
      tableName: "vwBodyTypes",
      modelName: "vwBodyTypes",
      timestamps: false,
    },
  );

  return vwBodyTypes;
};
