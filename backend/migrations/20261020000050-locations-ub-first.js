"use strict";

// Байршил: Улаанбаатар эхэнд, бусад аймаг нэрийн (монгол цагаан толгойн) дарааллаар
const locations = [
  "Улаанбаатар",
  "Архангай",
  "Баян-Өлгий",
  "Баянхонгор",
  "Булган",
  "Говь-Алтай",
  "Говьсүмбэр",
  "Дархан-Уул",
  "Дорноговь",
  "Дорнод",
  "Дундговь",
  "Завхан",
  "Орхон",
  "Өвөрхангай",
  "Өмнөговь",
  "Сүхбаатар",
  "Сэлэнгэ",
  "Төв",
  "Увс",
  "Ховд",
  "Хөвсгөл",
  "Хэнтий",
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const [i, name] of locations.entries()) {
      await queryInterface.bulkUpdate("locations", { sort_order: i + 1 }, { name });
    }
  },

  async down(queryInterface) {
    // Өмнөх дараалал: Улаанбаатар бусадтайгаа үсгийн дарааллаар
    const previous = [...locations.slice(1, 19), locations[0], ...locations.slice(19)];
    for (const [i, name] of previous.entries()) {
      await queryInterface.bulkUpdate("locations", { sort_order: i + 1 }, { name });
    }
  },
};
