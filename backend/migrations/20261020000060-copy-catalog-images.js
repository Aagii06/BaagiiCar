"use strict";

// public/uploads нь git-д ордоггүй (сервер дээрх бодит файлууд). Үйлдвэрийн лого,
// биеийн хэлбэрийн дүрсний эх файл seeders/data/{brands,bodyTypes}-д хадгалагдах ба
// энэ migration тэдгээрийг public/uploads руу хуулна. Байгаа файлыг дарахгүй.

const fs = require("fs");
const path = require("path");

const folders = ["brands", "bodyTypes"];
const source = (folder) => path.join(__dirname, "../seeders/data", folder);
const target = (folder) => path.join(__dirname, "../public/uploads", folder);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up() {
    for (const folder of folders) {
      await fs.promises.mkdir(target(folder), { recursive: true });
      for (const file of await fs.promises.readdir(source(folder))) {
        const to = path.join(target(folder), file);
        if (!fs.existsSync(to)) await fs.promises.copyFile(path.join(source(folder), file), to);
      }
    }
  },

  // Админаас солигдсон байж болох тул файлуудыг устгахгүй
  async down() {},
};
