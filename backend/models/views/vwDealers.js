const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class vwDealers extends Sequelize.Model {}

  vwDealers.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING },
      logo: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      description: { type: DataTypes.TEXT },

      status: { type: DataTypes.STRING },
      created_at: { type: DataTypes.STRING },

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
