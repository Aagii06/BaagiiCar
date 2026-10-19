"use strict";

// Апп-ын "assets/logos/x" замыг backend-ийн public/logos/x руу шилжүүлнэ (web, admin-д харагдуулахын тулд)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE brands SET logo = SUBSTRING(logo, 8) WHERE logo LIKE 'assets/logos/%'",
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE brands SET logo = CONCAT('assets/', logo) WHERE logo LIKE 'logos/%'",
    );
  },
};
