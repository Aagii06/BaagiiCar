"use strict";

// Вэбийн зочин хэрэглэгчийг (CUSTOMER) users-ээс тусдаа customers хүснэгтэд салгана.
// users-д зөвхөн ADMIN, DEALER үлдэнэ. Зочин хэрэглэгч зар оруулахгүй тул
// тэдний зарыг админд шилжүүлнэ. favorites нь customers-тэй холбогдоно.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements });

    await queryInterface.createTable(
      "customers",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        phonenumber: { type: Sequelize.STRING(20) },
        email: { type: Sequelize.STRING(254) },
        firstname: { type: Sequelize.STRING },
        lastname: { type: Sequelize.STRING },
        profile: { type: Sequelize.STRING },

        status: { type: Sequelize.STRING(20) },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
        last_login_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("customers", ["phonenumber"]);
    await queryInterface.addIndex("customers", ["email"]);

    const [[admin]] = await q("SELECT id FROM users WHERE role = 'ADMIN' AND status = 'active' ORDER BY id LIMIT 1");
    const [olds] = await q("SELECT * FROM users WHERE role = 'CUSTOMER'");
    const [favs] = await q(
      "SELECT f.user_id, f.car_id, f.created_at FROM favorites f JOIN users u ON u.id = f.user_id WHERE u.role = 'CUSTOMER'",
    );

    const idMap = {};
    for (const u of olds) {
      await q(
        `INSERT INTO customers (phonenumber, email, firstname, lastname, profile, status, created_at, updated_at, deleted_by, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.phonenumber, u.email, u.firstname, u.lastname, u.profile, u.status, u.created_at, u.updated_at, u.deleted_by, u.deleted_at],
      );
      const [[{ id }]] = await q("SELECT LAST_INSERT_ID() AS id");
      idMap[u.id] = id;
    }

    // Зочны зар админд шилжинэ
    if (olds.length) {
      if (!admin) throw new Error("Идэвхтэй ADMIN олдсонгүй — зочны зарыг шилжүүлэх боломжгүй");
      await q("UPDATE cars SET user_id = ? WHERE user_id IN (?)", [admin.id, olds.map((u) => u.id)]);
    }

    // favorites: user_id (users) -> customer_id (customers)
    await queryInterface.dropTable("favorites");
    await queryInterface.createTable(
      "favorites",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        customer_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "customers", key: "id" },
          onDelete: "CASCADE",
        },
        car_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "cars", key: "id" },
          onDelete: "CASCADE",
        },
        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("favorites", ["customer_id", "car_id"], { unique: true });
    for (const f of favs)
      if (idMap[f.user_id])
        await q("INSERT IGNORE INTO favorites (customer_id, car_id, created_at) VALUES (?, ?, ?)", [
          idMap[f.user_id],
          f.car_id,
          f.created_at,
        ]);

    if (olds.length) await q("DELETE FROM users WHERE id IN (?)", [olds.map((u) => u.id)]);
  },

  // Зочныг users руу буцаана (зарын эзэмшил админд үлдэнэ, хадгалсан зар устна)
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `INSERT INTO users (phonenumber, email, firstname, lastname, profile, role, status, created_at, updated_at, deleted_by, deleted_at)
       SELECT phonenumber, email, firstname, lastname, profile, 'CUSTOMER', status, created_at, updated_at, deleted_by, deleted_at FROM customers`,
    );
    await queryInterface.dropTable("favorites");
    await queryInterface.createTable(
      "favorites",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
        car_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: "cars", key: "id" }, onDelete: "CASCADE" },
        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("favorites", ["user_id", "car_id"], { unique: true });
    await queryInterface.dropTable("customers");
  },
};
