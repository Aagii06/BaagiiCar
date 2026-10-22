const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class emailOtps extends Sequelize.Model {}

  emailOtps.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      email: { type: DataTypes.STRING(254) },
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
      tableName: "email_otps",
      modelName: "emailOtps",
      timestamps: false,
    },
  );

  return emailOtps;
};
