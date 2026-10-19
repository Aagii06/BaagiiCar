const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class subscriptions extends Sequelize.Model {}

  subscriptions.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      kind: { type: DataTypes.STRING(10) },
      email: { type: DataTypes.STRING(254) },
      endpoint: { type: DataTypes.TEXT },
      endpoint_hash: { type: DataTypes.STRING(64) },
      p256dh: { type: DataTypes.STRING(255) },
      auth: { type: DataTypes.STRING(255) },
      token: { type: DataTypes.STRING(64) },
      status: { type: DataTypes.STRING(20) },

      otp_hash: { type: DataTypes.STRING(64) },
      otp_expires_at: { type: DataTypes.STRING },
      otp_sent_at: { type: DataTypes.STRING },
      otp_attempts: { type: DataTypes.INTEGER },
      last_car_id: { type: DataTypes.INTEGER },
      last_sent_at: { type: DataTypes.STRING },

      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "subscriptions",
      modelName: "subscriptions",
      timestamps: false,
    },
  );

  return subscriptions;
};
