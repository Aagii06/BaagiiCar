const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class vwDealers extends Sequelize.Model {}

  vwDealers.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      name: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      logo: { type: DataTypes.STRING },
      car_count: { type: DataTypes.INTEGER },
    },
    {
      sequelize,
      tableName: "vwDealers",
      modelName: "vwDealers",
      timestamps: false,
    },
  );

  return vwDealers;
};
