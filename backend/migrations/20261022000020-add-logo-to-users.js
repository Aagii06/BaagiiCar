"use strict";

// Дилерийн лого: users.profile нь хэрэглэгчийн өөрийн зураг, users.logo нь зөвхөн DEALER эрхтэй хэрэглэгчийн лого.
// Өмнө нь админ самбар дилерийн логог profile баганад хадгалдаг байсныг logo руу шилжүүлнэ.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "logo", { type: Sequelize.STRING, after: "profile" });
    await queryInterface.sequelize.query(
      "UPDATE users SET logo = profile, profile = NULL WHERE role = 'DEALER' AND profile IS NOT NULL AND profile <> ''",
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE users SET profile = logo WHERE role = 'DEALER' AND logo IS NOT NULL AND (profile IS NULL OR profile = '')",
    );
    await queryInterface.removeColumn("users", "logo");
  },
};
