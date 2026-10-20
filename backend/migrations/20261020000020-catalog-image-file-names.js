"use strict";

// Каталогийн зураг: баазад зөвхөн файлын нэрийг хадгална.
// Файл нь public/uploads/brands, public/uploads/bodyTypes дотор байрлах ба
// фронт URL-ийг өөрөө угсарна ({API}/uploads/brands/{logo}).
// http(s)-ээр эхэлсэн гадаад URL-ийг хэвээр үлдээнэ.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE brands SET logo = SUBSTRING_INDEX(logo, '/', -1) WHERE logo LIKE 'logos/%' OR logo LIKE 'uploads/brands/%'",
    );
    await queryInterface.sequelize.query(
      "UPDATE bodyTypes SET image = SUBSTRING_INDEX(image, '/', -1) WHERE image LIKE 'bodyTypes/%' OR image LIKE 'uploads/bodyTypes/%'",
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE brands SET logo = CONCAT('uploads/brands/', logo) WHERE logo IS NOT NULL AND logo <> '' AND logo NOT LIKE 'http%' AND logo NOT LIKE '%/%'",
    );
    await queryInterface.sequelize.query(
      "UPDATE bodyTypes SET image = CONCAT('uploads/bodyTypes/', image) WHERE image IS NOT NULL AND image <> '' AND image NOT LIKE 'http%' AND image NOT LIKE '%/%'",
    );
  },
};
