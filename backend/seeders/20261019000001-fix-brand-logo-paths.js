"use strict";

// Хуучин "assets/logos/x", "logos/x" замыг зөвхөн файлын нэр болгоно
// (файл public/uploads/brands дотор, фронт URL-ийг угсарна)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE brands SET logo = SUBSTRING_INDEX(logo, '/', -1) WHERE logo LIKE 'assets/logos/%' OR logo LIKE 'logos/%'",
    );
  },

  async down() {},
};
