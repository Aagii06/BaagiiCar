"use strict";

const fs = require("fs");
const path = require("path");

// Дилер тусдаа бүртгэл болно: dealers хүснэгт (нэр, лого, холбоо барих).
// ADMIN / DEALER эрхтэй хэрэглэгч users.dealer_id-аар дилерт харьяалагдана, зар cars.dealer_id-аар.
// Хуучин DEALER хэрэглэгч бүрээс дилер үүсгэж (лого нь uploads/users → uploads/dealers), users.logo-г устгана.

const uploads = path.join(__dirname, "../public/uploads");

const vwCarsSql = (withDealer) => `
  CREATE OR REPLACE VIEW vwCars AS
  SELECT
    c.id, c.code, c.user_id,${withDealer ? " c.dealer_id," : ""} c.brand_id, c.car_model_id, c.body_type_id, c.location_id,
    c.manufactured_year, c.imported_year, c.price, c.mileage,
    c.fuel_type, c.transmission, c.drive_type, c.steering,
    c.engine_capacity, c.color, c.vin, c.phonenumber, c.description,
    c.view_count, c.is_featured, c.sold_at,
    c.reject_reason, c.rejected_at,
    c.status, c.created_by, c.updated_by, c.deleted_by,
    c.created_at, c.updated_at, c.deleted_at,
    CONCAT_WS(' ', b.name, m.name, c.manufactured_year) AS name,
    b.name AS brand_name,
    b.logo AS brand_logo,
    m.name AS model_name,
    bt.name AS body_type_name,
    l.name AS location_name,
    CONCAT_WS(' ', u.lastname, u.firstname) AS seller_name,
    u.phonenumber AS seller_phone,${withDealer ? "\n    d.name AS dealer_name,\n    d.logo AS dealer_logo," : ""}
    (
      SELECT f.generated_name FROM allFiles f
      WHERE f.object_name = 'cars' AND f.data_id = c.id
        AND (f.status IS NULL OR f.status <> 'deleted')
      ORDER BY f.\`order\`, f.id
      LIMIT 1
    ) AS image,
    (
      SELECT COUNT(*) FROM allFiles f
      WHERE f.object_name = 'cars' AND f.data_id = c.id
        AND (f.status IS NULL OR f.status <> 'deleted')
    ) AS image_count,
    (SELECT COUNT(*) FROM favorites fv WHERE fv.car_id = c.id) AS favorite_count
  FROM cars c
  LEFT JOIN brands b ON b.id = c.brand_id
  LEFT JOIN carModels m ON m.id = c.car_model_id
  LEFT JOIN bodyTypes bt ON bt.id = c.body_type_id
  LEFT JOIN locations l ON l.id = c.location_id
  LEFT JOIN users u ON u.id = c.user_id${withDealer ? "\n  LEFT JOIN dealers d ON d.id = c.dealer_id AND d.status <> 'deleted'" : ""}
`;

// Вэб дээр харагдах дилерүүд: идэвхтэй, идэвхтэй зартай (car_count > 0)
const vwDealersSql = `
  CREATE OR REPLACE VIEW vwDealers AS
  SELECT * FROM (
    SELECT
      d.id, d.name, d.phonenumber, d.logo,
      (SELECT COUNT(*) FROM cars c WHERE c.dealer_id = d.id AND c.status = 'active') AS car_count
    FROM dealers d
    WHERE d.status = 'active'
  ) x
  WHERE x.car_count > 0
`;

const oldVwDealersSql = `
  CREATE OR REPLACE VIEW vwDealers AS
  SELECT * FROM (
    SELECT
      u.id, u.firstname, u.lastname, u.phonenumber, u.logo,
      (
        SELECT COUNT(*) FROM cars c
        WHERE (c.user_id = u.id OR c.created_by = u.id) AND c.status = 'active'
      ) AS car_count
    FROM users u
    WHERE u.role = 'DEALER' AND u.status = 'active'
  ) d
  WHERE d.car_count > 0
`;

const copyLogo = async (fileName, from, to) => {
  if (!fileName || /^https?:\/\//.test(fileName)) return;
  const src = path.join(uploads, from, fileName);
  if (!fs.existsSync(src)) return;
  await fs.promises.mkdir(path.join(uploads, to), { recursive: true });
  await fs.promises.copyFile(src, path.join(uploads, to, fileName));
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const q = queryInterface.sequelize;
    await queryInterface.createTable(
      "dealers",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        name: { type: Sequelize.STRING },
        logo: { type: Sequelize.STRING },
        phonenumber: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        address: { type: Sequelize.STRING },
        description: { type: Sequelize.TEXT },

        status: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addColumn("users", "dealer_id", { type: Sequelize.INTEGER, after: "role" });
    await queryInterface.addColumn("cars", "dealer_id", { type: Sequelize.INTEGER, after: "user_id" });
    await queryInterface.addIndex("users", ["dealer_id"]);
    await queryInterface.addIndex("cars", ["dealer_id"]);

    // DEALER хэрэглэгч бүр → дилер
    const [dealerUsers] = await q.query(
      "SELECT id, firstname, lastname, phonenumber, email, logo, status, created_at FROM users WHERE role = 'DEALER' AND status <> 'deleted'",
    );
    for (const u of dealerUsers) {
      const name = [u.lastname, u.firstname].filter(Boolean).join(" ") || u.phonenumber || `Дилер #${u.id}`;
      await copyLogo(u.logo, "users", "dealers");
      const [dealerId] = await q.query(
        "INSERT INTO dealers (name, logo, phonenumber, email, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        {
          replacements: [name, u.logo || null, u.phonenumber, u.email, u.status === "active" ? "active" : "inactive", u.id, u.created_at],
          type: Sequelize.QueryTypes.INSERT,
        },
      );
      await q.query("UPDATE users SET dealer_id = ? WHERE id = ?", { replacements: [dealerId, u.id] });
      // Дилерт хамаарах эсвэл дилерийн өөрийн оруулсан зарууд
      await q.query("UPDATE cars SET dealer_id = ? WHERE user_id = ? OR created_by = ?", { replacements: [dealerId, u.id, u.id] });
    }

    await queryInterface.removeColumn("users", "logo");
    await q.query(vwCarsSql(true));
    await q.query(vwDealersSql);
  },

  async down(queryInterface, Sequelize) {
    const q = queryInterface.sequelize;
    await queryInterface.addColumn("users", "logo", { type: Sequelize.STRING, after: "profile" });
    await q.query(
      "UPDATE users u JOIN dealers d ON d.id = u.dealer_id SET u.logo = d.logo WHERE u.role = 'DEALER'",
    );
    const [logos] = await q.query("SELECT logo FROM users WHERE logo IS NOT NULL AND logo <> ''");
    for (const { logo } of logos) await copyLogo(logo, "dealers", "users");

    await q.query(vwCarsSql(false));
    await q.query(oldVwDealersSql);
    await queryInterface.removeColumn("cars", "dealer_id");
    await queryInterface.removeColumn("users", "dealer_id");
    await queryInterface.dropTable("dealers");
  },
};
