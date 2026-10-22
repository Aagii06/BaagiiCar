const fs = require("fs");
const { saveFile } = require("../../helper/fileHelper");
const { roles } = require("../../config/constants");

// Админаас каталогийн зураг (биеийн хэлбэрийн дүрс, үйлдвэрийн лого) солих.
// public/uploads/<folder> дотор хадгалаад зөвхөн файлын нэрийг буцаана,
// түүнийгээ мөрийн image/logo баганад хадгална (фронт URL-ийг угсарна).
// users - хэрэглэгчийн профайл зураг (users.profile), dealers - дилерийн лого (dealers.logo)
const folders = ["bodyTypes", "brands", "users", "dealers"];

module.exports.uploadImage = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  try {
    const folder = req.fields?.folder;
    let file = req.files?.image;
    if (Array.isArray(file)) file = file[0];

    const reject = async (message) => {
      // tmpFile дотор түр файл үлдээхгүй
      if (file?.filepath) await fs.promises.rm(file.filepath, { force: true });
      result.message = message;
      return res.status(200).json(result);
    };
    if (!folders.includes(folder)) return reject("Хавтасны нэр буруу байна");
    if (folder !== "users" && req.loggedUser?.role !== roles.admin) return reject("Танд энэ үйлдлийг хийх эрх байхгүй");
    if (!file || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.mimetype))
      return reject("PNG, JPG, WEBP эсвэл SVG зураг сонгоно уу");

    // Дүрс жижиг тул хэмжээ өөрчлөхгүй, шууд хадгална (тунгалаг дэвсгэр хадгалагдана)
    const { fileName } = await saveFile(file, folder, { resize: false });
    result.success = true;
    result.data = { fileName };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Зураг хадгалахад алдаа гарлаа";
    return res.status(200).json(result);
  }
};
