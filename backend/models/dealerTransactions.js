const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class dealerTransactions extends Sequelize.Model {}

  // Дилерийн дансны гүйлгээ (helper/walletHelper.js). Үлдэгдэл = status "done" мөрүүдийн amount-ийн нийлбэр
  dealerTransactions.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      dealer_id: { type: DataTypes.INTEGER },
      // topup | renew | adjust
      type: { type: DataTypes.STRING(10) },
      // qpay | bank | balance | admin
      method: { type: DataTypes.STRING(10) },
      // Орлого (+), зарлага (-)
      amount: { type: DataTypes.DECIMAL(14, 2) },
      // pending | done | rejected
      status: { type: DataTypes.STRING(10), defaultValue: "done" },
      car_id: { type: DataTypes.INTEGER },
      qpay_invoice_id: { type: DataTypes.INTEGER },
      note: { type: DataTypes.STRING(500) },
      reject_reason: { type: DataTypes.STRING(500) },
      created_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      reviewed_by: { type: DataTypes.INTEGER },
      reviewed_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "dealerTransactions", modelName: "dealerTransactions", timestamps: false },
  );

  return dealerTransactions;
};
