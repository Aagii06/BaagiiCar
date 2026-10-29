const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class vwCarDailyStats extends Sequelize.Model {}

  vwCarDailyStats.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      car_id: { type: DataTypes.INTEGER },
      date: { type: DataTypes.STRING },
      day_view_count: { type: DataTypes.INTEGER },
      day_phone_view_count: { type: DataTypes.INTEGER },

      code: { type: DataTypes.STRING },
      user_id: { type: DataTypes.INTEGER },
      dealer_id: { type: DataTypes.INTEGER },
      status: { type: DataTypes.STRING },
      price: { type: DataTypes.BIGINT },
      manufactured_year: { type: DataTypes.INTEGER },
      imported_year: { type: DataTypes.INTEGER },
      phonenumber: { type: DataTypes.STRING },
      view_count: { type: DataTypes.INTEGER },
      phone_view_count: { type: DataTypes.INTEGER },

      name: { type: DataTypes.STRING },
      brand_name: { type: DataTypes.STRING },
      model_name: { type: DataTypes.STRING },
      body_type_name: { type: DataTypes.STRING },
      seller_name: { type: DataTypes.STRING },
      dealer_name: { type: DataTypes.STRING },
      image: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "vwCarDailyStats",
      modelName: "vwCarDailyStats",
      timestamps: false,
    },
  );

  return vwCarDailyStats;
};
