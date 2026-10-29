const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class carDailyStats extends Sequelize.Model {
    static associate({ cars }) {
      this.belongsTo(cars, { as: "car", foreignKey: "car_id" });
    }
  }

  carDailyStats.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      car_id: { type: DataTypes.INTEGER },
      // Улаанбаатарын цагаар "YYYY-MM-DD"
      date: { type: DataTypes.STRING },
      view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
      phone_view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      sequelize,
      tableName: "carDailyStats",
      modelName: "carDailyStats",
      timestamps: false,
    },
  );

  return carDailyStats;
};
