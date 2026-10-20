"use strict";

// Хөтлөгч: FWD, RWD, 4WD гэсэн 3 сонголт үлдэнэ. AWD-тэй зарыг 4WD болгоно.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("UPDATE cars SET drive_type = '4WD' WHERE drive_type = 'AWD'");
  },

  // AWD байсан зарыг 4WD-ээс ялгах боломжгүй
  async down() {},
};
