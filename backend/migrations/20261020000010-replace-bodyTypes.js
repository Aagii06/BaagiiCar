"use strict";

// Биеийн хэлбэрийг шинэ жагсаалтаар солино. Зураг: public/bodyTypes/*.png
// (сервер static-аар /bodyTypes/... гэж өгнө, image баганад харьцангуй зам хадгална)

const bodyTypes = [
  ["Микро", "01-micro.png"],
  ["Седан", "02-sedan.png"],
  ["Хэтчбэк", "03-hatchback.png"],
  ["Универсал", "04-universal.png"],
  ["Лифтбэк", "05-liftback.png"],
  ["Купе", "06-coupe.png"],
  ["Кабриолет", "07-cabriolet.png"],
  ["Родстер", "08-roadster.png"],
  ["Тарга", "09-targa.png"],
  ["Лимузин", "10-limousine.png"],
  ["Масл кар", "11-muscle-car.png"],
  ["Спорт", "12-sports-car.png"],
  ["Супер кар", "13-super-car.png"],
  ["Жийп", "14-suv.png"],
  ["Кроссовер", "15-crossover.png"],
  ["Пикап", "16-pickup.png"],
  ["Ван", "17-van.png"],
  ["Минивэн", "18-minivan.png"],
  ["Микроавтобус", "19-minibus.png"],
  ["Кемпер", "20-campervan.png"],
  ["Автобус", "21-bus.png"],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // cars.body_type_id FK-тэй тул TRUNCATE хийхэд түр унтраана
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.sequelize.query("TRUNCATE TABLE bodyTypes");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    await queryInterface.bulkInsert(
      "bodyTypes",
      bodyTypes.map(([name, file], i) => ({
        name,
        image: `bodyTypes/${file}`,
        sort_order: i + 1,
        status: "active",
        created_at: "2026-10-20 00:00:00",
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.sequelize.query("TRUNCATE TABLE bodyTypes");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  },
};
