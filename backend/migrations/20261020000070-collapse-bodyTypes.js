"use strict";

// Биеийн хэлбэрийг 4 үндсэн төрөл болгоно. Хуучин төрлийн зарууд шинэ төрөл рүү шилжиж,
// хэрэглэгдэхгүй болсон мөрүүд устгагдана. Дүрс нь public/uploads/bodyTypes доторх файл.

const groups = [
  { name: "Жийп", image: "14-suv.png", from: ["Жийп", "Кроссовер"] },
  {
    name: "Суудлын тэрэг",
    image: "02-sedan.png",
    from: ["Седан", "Микро", "Хэтчбэк", "Универсал", "Лифтбэк", "Купе", "Кабриолет", "Родстер", "Тарга", "Лимузин", "Масл кар", "Спорт", "Супер кар"],
  },
  { name: "Гэр бүлийн", image: "18-minivan.png", from: ["Минивэн", "Микроавтобус", "Кемпер", "Автобус"] },
  { name: "Ачааны машин", image: "16-pickup.png", from: ["Пикап", "Ван"] },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements }).then(([rows]) => rows);
    const at = "2026-10-20 00:00:00";
    const keepIds = [];

    for (const [i, g] of groups.entries()) {
      // Шинэ нэртэй мөр байвал түүнийг, үгүй бол хуучин төрлийн эхнийхийг ашиглана (id, зарууд хэвээр)
      let [row] = await q("SELECT id FROM bodyTypes WHERE name = :name ORDER BY id LIMIT 1", { name: g.name });
      if (!row) [row] = await q("SELECT id FROM bodyTypes WHERE name IN (:from) ORDER BY FIELD(name, :from), id LIMIT 1", { from: g.from });
      if (!row) {
        await queryInterface.bulkInsert("bodyTypes", [{ name: g.name, image: g.image, sort_order: i + 1, status: "active", created_at: at }]);
        [row] = await q("SELECT id FROM bodyTypes WHERE name = :name ORDER BY id LIMIT 1", { name: g.name });
      }
      await q("UPDATE bodyTypes SET name = :name, image = :image, sort_order = :sort, status = 'active', updated_at = :at WHERE id = :id", {
        name: g.name, image: g.image, sort: i + 1, at, id: row.id,
      });
      await q("UPDATE cars SET body_type_id = :id WHERE body_type_id IN (SELECT id FROM (SELECT id FROM bodyTypes WHERE name IN (:from)) t)", {
        id: row.id, from: g.from,
      });
      keepIds.push(row.id);
    }

    // Үлдсэн төрлийн зарыг (байвал) "Суудлын тэрэг" рүү шилжүүлээд мөрийг устгана
    await q("UPDATE cars SET body_type_id = :fallback WHERE body_type_id IS NOT NULL AND body_type_id NOT IN (:keepIds)", {
      fallback: keepIds[1], keepIds,
    });
    await q("DELETE FROM bodyTypes WHERE id NOT IN (:keepIds)", { keepIds });
  },

  async down() {
    // Хуучин 21 төрөл рүү буцаах боломжгүй (зарууд нэгтгэгдсэн)
  },
};
