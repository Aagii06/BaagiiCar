const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class qpayInvoices extends Sequelize.Model {}

  // Дилерийн дансыг QPay-ээр цэнэглэх нэхэмжлэх (helper/qpayHelper.js)
  qpayInvoices.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      dealer_id: { type: DataTypes.INTEGER },
      sender_invoice_no: { type: DataTypes.STRING(45) },
      invoice_id: { type: DataTypes.STRING },
      amount: { type: DataTypes.DECIMAL(14, 2) },
      // pending | paid
      status: { type: DataTypes.STRING(10), defaultValue: "pending" },
      qr_text: { type: DataTypes.TEXT },
      qr_image: { type: DataTypes.TEXT("medium") },
      short_url: { type: DataTypes.STRING },
      urls: { type: DataTypes.TEXT },
      payment_id: { type: DataTypes.STRING },
      paid_at: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "qpayInvoices", modelName: "qpayInvoices", timestamps: false },
  );

  return qpayInvoices;
};
