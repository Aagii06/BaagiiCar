"use strict";

// data/car_brands_models.json-оос үйлдвэр → загварыг brands, carModels хүснэгтэд оруулна.
// Зөвхөн байхгүйг нэмнэ: одоо байгаа үйлдвэрийн лого, эрэмбэ хэвээр үлдэнэ.
// Шинэ үйлдвэрүүд одоогийнхийн ард цагаан толгойн дарааллаар, "Other" хамгийн сүүлд.

const data = require("./data/car_brands_models.json");

const createdAt = "2026-10-20 00:00:00";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const q = (sql) => queryInterface.sequelize.query(sql).then(([rows]) => rows);

    const existingBrands = await q("SELECT MIN(id) id, name FROM brands WHERE status <> 'deleted' GROUP BY name");
    const brandId = new Map(existingBrands.map((b) => [b.name.toLowerCase(), b.id]));
    const [{ maxSort }] = await q("SELECT COALESCE(MAX(sort_order), 0) maxSort FROM brands");

    let sort = maxSort;
    const newBrands = data
      .filter(({ brand }) => !brandId.has(brand.toLowerCase()))
      .map(({ brand }) => ({
        name: brand,
        sort_order: brand === "Other" ? 999 : ++sort,
        status: "active",
        created_at: createdAt,
      }));
    if (newBrands.length) await queryInterface.bulkInsert("brands", newBrands);

    (await q("SELECT MIN(id) id, name FROM brands WHERE status <> 'deleted' GROUP BY name")).forEach((b) =>
      brandId.set(b.name.toLowerCase(), b.id),
    );

    const existingModels = await q("SELECT brand_id, name FROM carModels WHERE status <> 'deleted'");
    const modelKeys = new Set(existingModels.map((m) => `${m.brand_id}:${m.name.toLowerCase()}`));

    const newModels = [];
    data.forEach(({ brand, models }) => {
      const id = brandId.get(brand.toLowerCase());
      models.forEach((name) => {
        const key = `${id}:${name.toLowerCase()}`;
        if (modelKeys.has(key)) return;
        modelKeys.add(key);
        newModels.push({ brand_id: id, name, status: "active", created_at: createdAt });
      });
    });
    if (newModels.length) await queryInterface.bulkInsert("carModels", newModels);
  },

  async down(queryInterface) {
    // Энэ migration-оор нэмсэн мөрүүдийг (created_at-аар нь) устгана, зар холбогдоогүй бол
    await queryInterface.sequelize.query(
      `DELETE m FROM carModels m LEFT JOIN cars c ON c.car_model_id = m.id
       WHERE m.created_at = '${createdAt}' AND c.id IS NULL`,
    );
    await queryInterface.sequelize.query(
      `DELETE b FROM brands b LEFT JOIN carModels m ON m.brand_id = b.id LEFT JOIN cars c ON c.brand_id = b.id
       WHERE b.created_at = '${createdAt}' AND m.id IS NULL AND c.id IS NULL`,
    );
  },
};
