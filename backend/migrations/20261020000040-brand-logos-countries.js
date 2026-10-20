"use strict";

// Лого, улсгүй үйлдвэрүүдэд (20261020000030-аар нэмсэн) лого, үйлдвэрлэгч улсыг оруулна.
// Лого файлууд public/uploads/brands дотор, баазад зөвхөн файлын нэр.
// Эх сурвалж: github.com/filippofilip95/car-logos-dataset; Fuso, Tank, Voyah — Wikipedia;
// "Other" — ерөнхий машины дүрс. Улс нь брэндийн эх орон (Volvo → Sweden гэх мэт).

const brands = {
  Acura: ["Japan", "acura.png"],
  "Alfa Romeo": ["Italy", "alfa-romeo.png"],
  "Aston Martin": ["United Kingdom", "aston-martin.png"],
  BAIC: ["China", "baic-motor.png"],
  Cadillac: ["USA", "cadillac.png"],
  Changan: ["China", "changan.png"],
  Chery: ["China", "chery.png"],
  Chrysler: ["USA", "chrysler.png"],
  Citroen: ["France", "citroen.png"],
  Dacia: ["Romania", "dacia.png"],
  Daewoo: ["South Korea", "daewoo.png"],
  Daihatsu: ["Japan", "daihatsu.png"],
  Dodge: ["USA", "dodge.png"],
  Dongfeng: ["China", "dongfeng.png"],
  Exeed: ["China", "exeed.png"],
  Fiat: ["Italy", "fiat.png"],
  Fuso: ["Japan", "fuso.png"],
  GAC: ["China", "gac-group.png"],
  GAZ: ["Russia", "gaz.png"],
  Geely: ["China", "geely.png"],
  Genesis: ["South Korea", "genesis.png"],
  GMC: ["USA", "gmc.png"],
  "Great Wall": ["China", "great-wall.png"],
  Haval: ["China", "haval.png"],
  Hino: ["Japan", "hino.png"],
  Hongqi: ["China", "hongqi.png"],
  Hummer: ["USA", "hummer.png"],
  Infiniti: ["Japan", "infiniti.png"],
  Isuzu: ["Japan", "isuzu.png"],
  Jaguar: ["United Kingdom", "jaguar.png"],
  Jetour: ["China", "jetour.png"],
  Kamaz: ["Russia", "kamaz.png"],
  "Lada (VAZ)": ["Russia", "lada.png"],
  "Li Auto": ["China", "li-auto.png"],
  Lifan: ["China", "lifan.png"],
  Lincoln: ["USA", "lincoln.png"],
  Maserati: ["Italy", "maserati.png"],
  MG: ["United Kingdom", "mg.png"],
  Mini: ["United Kingdom", "mini.png"],
  Opel: ["Germany", "opel.png"],
  Peugeot: ["France", "peugeot.png"],
  Ram: ["USA", "ram.png"],
  Renault: ["France", "renault.png"],
  "Rolls-Royce": ["United Kingdom", "rolls-royce.png"],
  Skoda: ["Czech Republic", "skoda.png"],
  SsangYong: ["South Korea", "ssangyong.png"],
  Tank: ["China", "tank.png"],
  UAZ: ["Russia", "uaz.png"],
  Voyah: ["China", "voyah.png"],
  Xpeng: ["China", "xpeng.png"],
  Zeekr: ["China", "zeekr.png"],
  Other: [null, "other.png"],
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Админаас аль хэдийн оруулсан лого, улсыг дарахгүй
    for (const [name, [country, logo]] of Object.entries(brands)) {
      await queryInterface.sequelize.query(
        `UPDATE brands
         SET logo = COALESCE(NULLIF(logo, ''), :logo),
             country = COALESCE(NULLIF(country, ''), :country)
         WHERE name = :name`,
        { replacements: { name, logo, country } },
      );
    }
  },

  async down(queryInterface) {
    for (const [name, [, logo]] of Object.entries(brands)) {
      await queryInterface.sequelize.query(
        "UPDATE brands SET logo = NULL, country = NULL WHERE name = :name AND logo = :logo",
        { replacements: { name, logo } },
      );
    }
  },
};
