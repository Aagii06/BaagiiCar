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

    if (!folders.includes(folder)) {
      result.message = "Хавтасны нэр буруу байна";
      return res.status(200).json(result);
    }
    if (!file || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.mimetype)) {
      result.message = "PNG, JPG, WEBP эсвэл SVG зураг сонгоно уу";
      return res.status(200).json(result);
    }

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
