const path = require("path");
const formidable = require("formidable");
const { MAX_UPLOAD_BYTES, TOO_LARGE_MESSAGE, isTooLarge } = require("../helper/fileHelper");

module.exports.extractFormData = async (req, res, next) => {
  const form = formidable({
    maxFileSize: MAX_UPLOAD_BYTES,
    maxFieldsSize: 1000 * 1024 * 1024,
    multiples: true,
    keepExtensions: true,
    uploadDir: path.join(__dirname, "../tmpFile"),
  });

  const parsed = await new Promise(function (resolve, reject) {
    form.parse(req, async function (err, fields, files) {
      if (err) return reject(err);
      if (fields) {
        if (fields.data && fields.data !== "undefined") {
          req.body = JSON.parse(fields.data);
        }
        if (fields.modifyData && fields.modifyData !== "undefined") {
          req.body.modifyData = JSON.parse(fields.modifyData);
        }
        req.fields = fields;
        req.files = files;
      }
      resolve(true);
    });
  }).catch(function (error) {
    console.error({ promiseError: error });
    res.status(200).json({ success: false, message: isTooLarge(error) ? TOO_LARGE_MESSAGE : "Алдаа" });
    return false;
  });

  // Алдааны хариу аль хэдийн илгээгдсэн бол дараагийн handler руу орохгүй
  if (parsed) next();
};
