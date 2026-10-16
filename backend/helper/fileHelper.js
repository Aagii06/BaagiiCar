const moment = require("moment");
const path = require("path");
const fs = require("fs");
const str = require("@supercharge/strings");
const sharp = require("sharp");

const fileURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${process.env.PORT || 5011}/uploads`
    : "https://odexpresss.com:8898/uploads";

module.exports.fileURL = () => fileURL;

module.exports.getDateNumbers = () =>
  moment().utcOffset("+0800").format("YYYYMMDDHHmmss");

module.exports.getType = (fileName) => path.extname(fileName).replace(".", "");

module.exports.saveSharpConverter = async (tempPath, uploadPath, fileName) => {
  const sizes = [
    { width: 64, prefix: "icon_" },
    { width: 120, prefix: "thumb_" },
    { width: 300, prefix: "grid_" },
    { width: 800, prefix: "" },
  ];

  await Promise.all(
    sizes.map(({ width, prefix }) =>
      sharp(tempPath)
        .resize({ width, withoutEnlargement: true })
        .toFile(path.join(uploadPath, `${prefix}${fileName}`)),
    ),
  );
};

const isImage = (file) => /^image\/(jpeg|png|webp)$/.test(file.mimetype);

// Бүх upload-ийн нэгдсэн хадгалах функц
// file   - formidable-ийн файл объект
// folder - public/uploads доторх хавтас ("deliveries", "deliveries/excel" гэх мэт)
// suffix - нэг хүсэлтэд олон файл ирэхэд нэр давхцахгүй байлгах төгсгөл
// resize - true бол sharp-аар 4 хэмжээгээр, false бол шууд хуулж хадгална
module.exports.saveFile = async (
  file,
  folder,
  { suffix = "", resize = isImage(file) } = {},
) => {
  const fileType = this.getType(file.newFilename);
  const fileName = `${this.getDateNumbers()}_${str.random()}${suffix}.${fileType}`;
  const uploadPath = path.join(__dirname, "../public/uploads", folder);
  const filePath = path.join(uploadPath, fileName);

  await fs.promises.mkdir(uploadPath, { recursive: true });
  if (resize) await this.saveSharpConverter(file.filepath, uploadPath, fileName);
  else await fs.promises.copyFile(file.filepath, filePath);
  // tmpFile дотор түр файл хуримтлагдахгүй байх
  await fs.promises.rm(file.filepath, { force: true });

  return { fileName, filePath };
};

module.exports.uploadImage = async (objectName, files) => {
  const file = files?.image;
  if (!file) return null;
  const { fileName } = await this.saveFile(file, objectName, { resize: true });
  return fileName;
};

module.exports.uploadExcel = async (objectName, files) => {
  const file = files?.image;
  if (!file) return { newFilePath: null };
  const { filePath } = await this.saveFile(file, objectName + "/excel", {
    resize: false,
  });
  return { newFilePath: filePath };
};

module.exports.uploadFiles = async (
  model,
  op,
  fields,
  files,
  id,
  objectName,
  fieldName,
) => {
  // odoo baigaa file-uudaa duudaj avah
  let fileCount = 0;
  let createFiles = [];
  let nowFiles = [];
  let notDeleteFiles = [];
  // get now files
  if (model && id && objectName && fieldName) {
    nowFiles = await model.findAll({
      attributes: ["id"],
      where: {
        data_id: id,
        object_name: objectName,
        field_name: fieldName,
        status: { [op.ne]: "deleted" },
      },
      raw: true,
    });
  }

  // set new files
  for (const field in fields) {
    if (field !== "data" && field.indexOf("Info") > -1) {
      fileCount++;
      let fileInfo = fields[field] !== "undefined" && JSON.parse(fields[field]);
      if (fileInfo) {
        //not change file
        if (fileInfo.id) {
          if (nowFiles.filter((s) => s.id === fileInfo.id).length === 1)
            notDeleteFiles.push(fileInfo.id);
        } else {
          //new file
          const key = field.replace("Info", "");
          const newFile = files[key] ? files[key] : null;
          let tempValue = {
            extension: null,
            size: null,
            generated_name: null,
            original_name: null,
          };
          if (newFile) {
            const { fileName } = await this.saveFile(newFile, objectName, {
              suffix: "_" + fileCount,
            });
            tempValue = {
              field_name: fieldName,
              object_name: objectName,
              extension: this.getType(fileName),
              size: newFile.size,
              generated_name: fileName,
              original_name: fileInfo.original_name,
            };
          }
          createFiles.push(tempValue);
        }
      }
    }
  }

  return { createFiles, nowFiles, notDeleteFiles };
};
