"use strict";

// Төлбөр: админы төлбөрийн тохиргоо (шинэчлэлийн үнэ, банкны данс, QPay), дилерийн дансны гүйлгээ,
// дансаа QPay-ээр цэнэглэх нэхэмжлэх. Дилерийн үлдэгдэл = dealerTransactions-ийн "done" гүйлгээний нийлбэр.
// Дилер 7 хоног болоогүй зараа дансныхаа үлдэгдлээс renew_price төлж шинэчилнэ (api/cars renew).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const opts = { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" };

    // Ганц мөр (id = 1). Админ самбарын "Төлбөрийн тохиргоо"-оос засна (api/payments/settings)
    await queryInterface.createTable(
      "paymentSettings",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        // Дилер 7 хоног хүлээлгүй зараа шинэчлэх нэг удаагийн үнэ (₮)
        renew_price: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        // Дансаар шилжүүлэх — дилер шилжүүлээд хүсэлт илгээнэ, админ баталгаажуулахад дансанд орно
        bank_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
        bank_name: { type: Sequelize.STRING },
        bank_account_name: { type: Sequelize.STRING },
        bank_account_number: { type: Sequelize.STRING },
        bank_iban: { type: Sequelize.STRING },
        // QPay merchant (https://merchant.qpay.mn) — sandbox нь merchant-sandbox.qpay.mn
        qpay_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
        qpay_sandbox: { type: Sequelize.BOOLEAN, defaultValue: true },
        qpay_username: { type: Sequelize.STRING },
        qpay_password: { type: Sequelize.STRING },
        qpay_invoice_code: { type: Sequelize.STRING },
        updated_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      opts,
    );

    // Дилерийн дансны гүйлгээ. amount: орлого (+), зарлага (-).
    // type: topup (цэнэглэлт) | renew (зар шинэчилсэн) | adjust (админ гараар засварласан)
    // method: qpay | bank | balance | admin
    // status: pending (дансаар шилжүүлсэн, админ шалгаагүй) | done | rejected
    await queryInterface.createTable(
      "dealerTransactions",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dealer_id: { type: Sequelize.INTEGER, allowNull: false },
        type: { type: Sequelize.STRING(10), allowNull: false },
        method: { type: Sequelize.STRING(10), allowNull: false },
        amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
        status: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "done" },
        car_id: { type: Sequelize.INTEGER },
        qpay_invoice_id: { type: Sequelize.INTEGER },
        // Дилерийн тайлбар (шилжүүлгийн утга г.м.)
        note: { type: Sequelize.STRING(500) },
        // Админы буцаасан шалтгаан
        reject_reason: { type: Sequelize.STRING(500) },
        created_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        reviewed_by: { type: Sequelize.INTEGER },
        reviewed_at: { type: Sequelize.STRING },
      },
      opts,
    );
    await queryInterface.addIndex("dealerTransactions", ["dealer_id", "status"]);
    await queryInterface.addIndex("dealerTransactions", ["status", "created_at"]);

    // Дилер дансаа QPay-ээр цэнэглэх нэхэмжлэх. Төлөгдсөнийг payment/check-ээр шалгана
    await queryInterface.createTable(
      "qpayInvoices",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dealer_id: { type: Sequelize.INTEGER, allowNull: false },
        // Манай талын давтагдашгүй дугаар — QPay-ийн callback URL-д мөн орно
        sender_invoice_no: { type: Sequelize.STRING(45), allowNull: false, unique: true },
        invoice_id: { type: Sequelize.STRING },
        amount: { type: Sequelize.DECIMAL(14, 2) },
        // pending | paid
        status: { type: Sequelize.STRING(10), defaultValue: "pending" },
        qr_text: { type: Sequelize.TEXT },
        qr_image: { type: Sequelize.TEXT("medium") },
        short_url: { type: Sequelize.STRING },
        // Банкны апп руу шилжих холбоосууд (JSON)
        urls: { type: Sequelize.TEXT },
        payment_id: { type: Sequelize.STRING },
        paid_at: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      opts,
    );
    await queryInterface.addIndex("qpayInvoices", ["dealer_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("qpayInvoices");
    await queryInterface.dropTable("dealerTransactions");
    await queryInterface.dropTable("paymentSettings");
  },
};
