const path = require("path");
const formidable = require("formidable");

module.exports.extractFormData = async (req, res, next) => {
  const form = formidable({
    maxFileSize: 1000 * 1024 * 1024,
    maxFieldsSize: 1000 * 1024 * 1024,
    multiples: true,
    keepExtensions: true,
    uploadDir: path.join(__dirname, "../tmpFile"),
  });

  await new Promise(function (resolve, reject) {
    form.parse(req, async function (err, fields, files) {
      if (err) reject(err);
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
      resolve();
    });
  }).catch(function (error) {
    console.error({ promiseError: error });
    return res.status(200).json({ success: false, message: "Алдаа" });
  });

  next();
};
