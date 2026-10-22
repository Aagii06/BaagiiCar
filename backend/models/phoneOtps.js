const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class phoneOtps extends Sequelize.Model {}

  phoneOtps.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      phonenumber: { type: DataTypes.STRING(20) },
      purpose: { type: DataTypes.STRING(20) },
      otp_hash: { type: DataTypes.STRING(64) },
      expires_at: { type: DataTypes.STRING },
      sent_at: { type: DataTypes.STRING },
      attempts: { type: DataTypes.INTEGER },

      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "phone_otps",
      modelName: "phoneOtps",
      timestamps: false,
    },
  );

  return phoneOtps;
};
