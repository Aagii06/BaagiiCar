"use strict";

// Апп-ын lib/data/car_brands.dart, car_body_types.dart, filter_data.dart-аас авсан анхны өгөгдөл

const brands = [
  ["Toyota", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/toyota&w=128&h=128"],
  ["Honda", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/honda&w=128&h=128"],
  ["Nissan", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/nissan&w=128&h=128"],
  ["Lexus", "Japan", "logos/lexus.png"],
  ["Mazda", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/mazda&w=128&h=128"],
  ["Subaru", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/subaru&w=128&h=128"],
  ["Suzuki", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/suzuki&w=128&h=128"],
  ["Mitsubishi", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/mitsubishi&w=128&h=128"],
  ["Mercedes-Benz", "Germany", "https://images.weserv.nl/?url=cdn.jsdelivr.net/npm/simple-icons@latest/icons/mercedes.svg&w=128&h=128"],
  ["BMW", "Germany", "https://images.weserv.nl/?url=cdn.simpleicons.org/bmw&w=128&h=128"],
  ["Audi", "Germany", "https://images.weserv.nl/?url=cdn.simpleicons.org/audi&w=128&h=128"],
  ["Volkswagen", "Germany", "https://images.weserv.nl/?url=cdn.simpleicons.org/volkswagen&w=128&h=128"],
  ["Porsche", "Germany", "https://images.weserv.nl/?url=cdn.simpleicons.org/porsche&w=128&h=128"],
  ["Hyundai", "South Korea", "https://images.weserv.nl/?url=cdn.simpleicons.org/hyundai&w=128&h=128"],
  ["Kia", "South Korea", "https://images.weserv.nl/?url=cdn.simpleicons.org/kia&w=128&h=128"],
  ["Tesla", "USA", "https://images.weserv.nl/?url=cdn.simpleicons.org/tesla&w=128&h=128"],
  ["Ford", "USA", "https://images.weserv.nl/?url=cdn.simpleicons.org/ford&w=128&h=128"],
  ["Chevrolet", "USA", "https://images.weserv.nl/?url=cdn.simpleicons.org/chevrolet&w=128&h=128"],
  ["Jeep", "USA", "https://images.weserv.nl/?url=cdn.simpleicons.org/jeep&w=128&h=128"],
  ["Land Rover", "United Kingdom", "https://icons.iconarchive.com/icons/simpleicons-team/simple/128/landrover-icon.png"],
  ["Bentley", "United Kingdom", "https://images.weserv.nl/?url=cdn.simpleicons.org/bentley&w=128&h=128"],
  ["Ferrari", "Italy", "https://images.weserv.nl/?url=cdn.simpleicons.org/ferrari&w=128&h=128"],
  ["Lamborghini", "Italy", "https://images.weserv.nl/?url=cdn.simpleicons.org/lamborghini&w=128&h=128"],
  ["Volvo", "Sweden", "https://images.weserv.nl/?url=cdn.simpleicons.org/volvo&w=128&h=128"],
  ["BYD", "China", "logos/byd.png"],
];

const carModels = {
  Toyota: ["Prius", "Land Cruiser", "Land Cruiser Prado", "Camry", "Corolla", "RAV4", "Harrier", "Alphard", "Hilux"],
  Lexus: ["RX", "LX", "GX", "NX", "ES"],
  Nissan: ["X-Trail", "Patrol", "Leaf", "Note"],
  Hyundai: ["Tucson", "Santa Fe", "Sonata", "Elantra", "Palisade"],
  Kia: ["Sorento", "Sportage", "K5", "Carnival"],
};

// Зураг: public/uploads/bodyTypes/*.png (migrations/20261020000010-replace-bodyTypes.js-тэй ижил)
const bodyTypes = [
  ["Микро", "uploads/bodyTypes/01-micro.png"],
  ["Седан", "uploads/bodyTypes/02-sedan.png"],
  ["Хэтчбэк", "uploads/bodyTypes/03-hatchback.png"],
  ["Универсал", "uploads/bodyTypes/04-universal.png"],
  ["Лифтбэк", "uploads/bodyTypes/05-liftback.png"],
  ["Купе", "uploads/bodyTypes/06-coupe.png"],
  ["Кабриолет", "uploads/bodyTypes/07-cabriolet.png"],
  ["Родстер", "uploads/bodyTypes/08-roadster.png"],
  ["Тарга", "uploads/bodyTypes/09-targa.png"],
  ["Лимузин", "uploads/bodyTypes/10-limousine.png"],
  ["Масл кар", "uploads/bodyTypes/11-muscle-car.png"],
  ["Спорт", "uploads/bodyTypes/12-sports-car.png"],
  ["Супер кар", "uploads/bodyTypes/13-super-car.png"],
  ["Жийп", "uploads/bodyTypes/14-suv.png"],
  ["Кроссовер", "uploads/bodyTypes/15-crossover.png"],
  ["Пикап", "uploads/bodyTypes/16-pickup.png"],
  ["Ван", "uploads/bodyTypes/17-van.png"],
  ["Минивэн", "uploads/bodyTypes/18-minivan.png"],
  ["Микроавтобус", "uploads/bodyTypes/19-minibus.png"],
  ["Кемпер", "uploads/bodyTypes/20-campervan.png"],
  ["Автобус", "uploads/bodyTypes/21-bus.png"],
];

// Дахин ажиллуулахад давхардахгүй: зөвхөн байхгүй нэрийг нэмнэ
const existingNames = async (queryInterface, table) => {
  const [rows] = await queryInterface.sequelize.query(`SELECT name FROM \`${table}\``);
  return new Set(rows.map((r) => r.name));
};

const insertMissing = async (queryInterface, table, rows) => {
  const existing = await existingNames(queryInterface, table);
  const missing = rows.filter((r) => !existing.has(r.name));
  if (missing.length) await queryInterface.bulkInsert(table, missing);
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const base = { status: "active", created_at: "2026-10-15 00:00:00" };

    await insertMissing(
      queryInterface,
      "brands",
      brands.map(([name, country, logo], i) => ({ ...base, name, country, logo, sort_order: i + 1 })),
    );

    const [brandRows] = await queryInterface.sequelize.query("SELECT MIN(id) id, name FROM brands GROUP BY name");
    const [existingModels] = await queryInterface.sequelize.query("SELECT brand_id, name FROM carModels");
    const modelKeys = new Set(existingModels.map((m) => `${m.brand_id}:${m.name}`));
    const modelRows = [];
    brandRows.forEach((brand) =>
      (carModels[brand.name] || []).forEach((name) => {
        if (!modelKeys.has(`${brand.id}:${name}`)) modelRows.push({ ...base, brand_id: brand.id, name });
      }),
    );
    if (modelRows.length) await queryInterface.bulkInsert("carModels", modelRows);

    await insertMissing(
      queryInterface,
      "bodyTypes",
      bodyTypes.map(([name, image], i) => ({ ...base, name, image, sort_order: i + 1 })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("carModels", null, {});
    await queryInterface.bulkDelete("brands", null, {});
    await queryInterface.bulkDelete("bodyTypes", null, {});
  },
};
