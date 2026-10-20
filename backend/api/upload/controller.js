const fs = require("fs");
const { saveFile } = require("../../helper/fileHelper");

// Админаас каталогийн зураг (биеийн хэлбэрийн дүрс, үйлдвэрийн лого) солих.
// Хадгалсан файлын харьцангуй замыг буцаана ("uploads/bodyTypes/....png"),
// түүнийгээ мөрийн image/logo баганад хадгална.
const folders = ["bodyTypes", "brands"];

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
    if (!file || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.mimetype))
      return reject("PNG, JPG, WEBP эсвэл SVG зураг сонгоно уу");

    // Дүрс жижиг тул хэмжээ өөрчлөхгүй, шууд хадгална (тунгалаг дэвсгэр хадгалагдана)
    const { fileName } = await saveFile(file, folder, { resize: false });
    result.success = true;
    result.data = { path: `uploads/${folder}/${fileName}` };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Зураг хадгалахад алдаа гарлаа";
    return res.status(200).json(result);
  }
};
