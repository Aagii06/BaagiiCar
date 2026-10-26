"use strict";

// 20261022000090-ийн дараа вэбийн /web/auth/otp-login зочныг users-д (role = CUSTOMER)
// үүсгэсээр байсан. Тэднийг customers руу шилжүүлж, вэбийн мессежийн created_by-г
// шинэ customer id руу солино. Ижил утастай customer байвал түүнтэй нэгтгэнэ.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements });

    const [olds] = await q("SELECT * FROM users WHERE role = 'CUSTOMER'");
    if (!olds.length) return;

    for (const u of olds) {
      const [[same]] = await q(
        "SELECT id FROM customers WHERE phonenumber = ? AND status <> 'deleted' ORDER BY id LIMIT 1",
        [u.phonenumber],
      );
      let id = same?.id;
      if (!id) {
        await q(
          `INSERT INTO customers (phonenumber, email, firstname, lastname, profile, status, created_at, updated_at, deleted_by, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.phonenumber, u.email, u.firstname, u.lastname, u.profile, u.status, u.created_at, u.updated_at, u.deleted_by, u.deleted_at],
        );
        [[{ id }]] = await q("SELECT LAST_INSERT_ID() AS id");
      }
      await q("UPDATE messages SET created_by = ? WHERE created_by = ?", [id, u.id]);
    }

    const ids = olds.map((u) => u.id);
    const [[admin]] = await q("SELECT id FROM users WHERE role = 'ADMIN' AND status = 'active' ORDER BY id LIMIT 1");
    if (admin) await q("UPDATE cars SET user_id = ? WHERE user_id IN (?)", [admin.id, ids]);
    await q("DELETE FROM users WHERE id IN (?)", [ids]);
  },

  // Буцаах боломжгүй: шилжүүлсэн мөрүүд customers-ийн хуучин мөртэй холилдсон
  async down() {},
};
