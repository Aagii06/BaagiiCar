"use strict";

// 20261022000090 нь CUSTOMER-уудыг customers руу шилжүүлсэн ч вэбийн нэвтрэлт (web/auth)
// users-д бичсээр байсан тул шинэ зочид дахин users-д үлдсэн. Тэднийг customers руу зөөнө:
// - утас нь customers-д (устгагдаагүй) байвал тэр мөртэй нэгтгэнэ, үгүй бол шинээр нэмнэ;
// - messages.created_by (зочны мессеж) шинэ customers.id руу заана;
// - зочны нэрээр байсан зар (байх ёсгүй ч) админд шилжинэ;
// - CUSTOMER мөрүүдийг users-ээс устгана.
// Хуучин токен (users id-тай) /web/auth/me дээр 401 авч, хэрэглэгч дахин нэвтэрнэ.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements, transaction });

      const [olds] = await q("SELECT * FROM users WHERE role = 'CUSTOMER' ORDER BY id");
      if (!olds.length) return;
      const oldIds = olds.map((u) => u.id);

      // Өмнө нь дилер вэбээр нэвтэрч бичсэн мессеж: users-ийн id тул customers-ийн id-тай андуурагдана - утсаар нь л холбоно
      await q(
        "UPDATE messages SET created_by = NULL WHERE created_by IS NOT NULL AND created_by NOT IN (?)",
        [oldIds],
      );
      // Шинэ id-д шилжүүлэх үед хуучин/шинэ id давхцахаас сэргийлж эхлээд сөрөг болгоно
      await q("UPDATE messages SET created_by = -created_by WHERE created_by IN (?)", [oldIds]);

      for (const u of olds) {
        const [[existing]] = await q(
          "SELECT id FROM customers WHERE phonenumber = ? AND status <> 'deleted' ORDER BY id LIMIT 1",
          [u.phonenumber],
        );
        let id = existing?.id;
        if (!id) {
          await q(
            `INSERT INTO customers (phonenumber, email, firstname, lastname, profile, status, created_at, updated_at, deleted_by, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.phonenumber, u.email, u.firstname, u.lastname, u.profile, u.status, u.created_at, u.updated_at, u.deleted_by, u.deleted_at],
          );
          [[{ id }]] = await q("SELECT LAST_INSERT_ID() AS id");
        }
        await q("UPDATE messages SET created_by = ? WHERE created_by = ?", [id, -u.id]);
      }

      const [[admin]] = await q("SELECT id FROM users WHERE role = 'ADMIN' AND status = 'active' ORDER BY id LIMIT 1");
      const [[{ n }]] = await q("SELECT COUNT(*) AS n FROM cars WHERE user_id IN (?)", [oldIds]);
      if (n) {
        if (!admin) throw new Error("Идэвхтэй ADMIN олдсонгүй — зочны зарыг шилжүүлэх боломжгүй");
        await q("UPDATE cars SET user_id = ? WHERE user_id IN (?)", [admin.id, oldIds]);
      }

      await q("DELETE FROM users WHERE id IN (?)", [oldIds]);
    });
  },

  // Буцаахгүй: users-ийн хуучин id-г сэргээх боломжгүй, зочид customers-д хэвээр үлдэнэ
  async down() {},
};
