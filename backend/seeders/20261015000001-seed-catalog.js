"use strict";

// Апп-ын lib/data/car_brands.dart, car_body_types.dart, filter_data.dart-аас авсан анхны өгөгдөл

const brands = [
  ["Toyota", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/toyota&w=128&h=128"],
  ["Honda", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/honda&w=128&h=128"],
  ["Nissan", "Japan", "https://images.weserv.nl/?url=cdn.simpleicons.org/nissan&w=128&h=128"],
  ["Lexus", "Japan", "assets/logos/lexus.jpg"],
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
  ["BYD", "China", "assets/logos/byd.png"],
];

const carModels = {
  Toyota: ["Prius", "Land Cruiser", "Land Cruiser Prado", "Camry", "Corolla", "RAV4", "Harrier", "Alphard", "Hilux"],
  Lexus: ["RX", "LX", "GX", "NX", "ES"],
  Nissan: ["X-Trail", "Patrol", "Leaf", "Note"],
  Hyundai: ["Tucson", "Santa Fe", "Sonata", "Elantra", "Palisade"],
  Kia: ["Sorento", "Sportage", "K5", "Carnival"],
};

const bodyTypes = [
  ["SUV", "https://img.icons8.com/ios-filled/100/suv.png"],
  ["Sedan", "https://img.icons8.com/ios-filled/100/sedan.png"],
  ["Hatchback", "https://img.icons8.com/ios-filled/100/hatchback.png"],
  ["Coupe", "https://img.icons8.com/ios-filled/100/sport-car.png"],
  ["Pickup", "https://img.icons8.com/ios-filled/100/pickup.png"],
  ["Van", "https://img.icons8.com/ios-filled/100/van.png"],
  ["Wagon", "https://img.icons8.com/ios-filled/100/station-wagon.png"],
  ["Convertible", "https://img.icons8.com/ios-filled/100/convertible.png"],
];

const locations = ["Улаанбаатар", "Дархан-Уул", "Орхон", "Сэлэнгэ", "Дорнод", "Ховд"];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const base = { status: "active", created_at: "2026-10-15 00:00:00" };

    await queryInterface.bulkInsert(
      "brands",
      brands.map(([name, country, logo], i) => ({ ...base, name, country, logo, sort_order: i + 1 })),
    );

    const [brandRows] = await queryInterface.sequelize.query("SELECT id, name FROM brands");
    const modelRows = [];
    brandRows.forEach((brand) =>
      (carModels[brand.name] || []).forEach((name) =>
        modelRows.push({ ...base, brand_id: brand.id, name }),
      ),
    );
    await queryInterface.bulkInsert("carModels", modelRows);

    await queryInterface.bulkInsert(
      "bodyTypes",
      bodyTypes.map(([name, image], i) => ({ ...base, name, image, sort_order: i + 1 })),
    );

    await queryInterface.bulkInsert(
      "locations",
      locations.map((name, i) => ({ ...base, name, sort_order: i + 1 })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("carModels", null, {});
    await queryInterface.bulkDelete("brands", null, {});
    await queryInterface.bulkDelete("bodyTypes", null, {});
    await queryInterface.bulkDelete("locations", null, {});
  },
};
