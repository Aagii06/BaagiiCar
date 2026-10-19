"use strict";

// Анхны админ хэрэглэгч. Нууц үгийг кодонд бичихгүйн тулд .env-ээс уншина:
// ADMIN_PHONENUMBER=99999999 ADMIN_PASSWORD=... npm run seed
require("dotenv").config({ path: __dirname + "/../.env" });
const bcrypt = require("bcrypt");
const { roles } = require("../config/constants");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { ADMIN_PHONENUMBER, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_PHONENUMBER || !ADMIN_PASSWORD) {
      console.log("ADMIN_PHONENUMBER / ADMIN_PASSWORD тохируулаагүй тул админ үүсгэсэнгүй");
      return;
    }

    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE phonenumber = ? AND status != 'deleted' LIMIT 1",
      { replacements: [ADMIN_PHONENUMBER] },
    );
    if (existing.length) {
      console.log(`${ADMIN_PHONENUMBER} дугаартай хэрэглэгч бүртгэлтэй тул алгаслаа`);
      return;
    }

    const password = await bcrypt.hash(ADMIN_PASSWORD, await bcrypt.genSalt(8));
    await queryInterface.bulkInsert("users", [
      {
        phonenumber: ADMIN_PHONENUMBER,
        firstname: "Админ",
        password,
        role: roles.admin,
        status: "active",
        created_at: "2026-10-15 00:00:00",
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { role: roles.admin }, {});
  },
};
