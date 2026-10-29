const fs = require("fs");
const path = require("path");
const str = require("@supercharge/strings");
const mime = require("mime-types");
const formidable = require("formidable");

const config = require("./config");

const { allFiles, sequelize, op } = require("../../models");

const { getType, getDateNumbers } = require("../../helper/fileHelper");
const { saveLog } = require("../../utils/logHelper");

const { getSelect } = require("../../utils/modelHelper");

exports.list = async (req, res) => {
  const { target } = req.params;
  const { limit, offset, where, select, order, group } = req;
  const model = config.targets[target] ? config.targets[target].model : null;

  try {
    if (model) {
      let modelSelect = {};
      getSelect(select, model, modelSelect);
      const { rows, count } = await model.findAndCountAll({
        ...modelSelect,
        limit,
        offset,
        where,
        order: order ? order : [],
        logging: (q) => console.log(q),
      });

      return res.status(200).json({
        message: "Амжилттай",
        success: true,
        data: { rows, count },
      });
    } else {
      return res.status(200).json({
        success: false,
        data: { rows: [], count: 0 },
        message: "Хүснэгт олдсонгүй",
      });
    }
  } catch (error) {
    console.log("listError:", error);
    return res.status(200).json({
      success: false,
      data: { rows: [], count: 0 },
      message: "Алдаа",
    });
  }
};

exports.lookup = async (req, res) => {
  const { target } = req.params;
  const { limit, offset, where, select, order } = req;
  const model = config.targets[target] ? config.targets[target].model : null;
  try {
    if (model) {
      let modelSelect = {};
      getSelect(select, model, modelSelect);
      const { rows, count } = await model.findAndCountAll({
        ...modelSelect,
        limit,
        offset,
        where,
        order: order ? order : [],
        logging: (q) => console.log(q),
      });

      return res
        .status(200)
        .json({ message: "", success: true, data: { rows, count } });
    } else {
      return res.status(200).json({
        message: "Хүснэгт олдсонгүй",
        success: false,
        data: null,
      });
    }
  } catch (error) {
    console.log("lookUpError:", error);
    return res.status(200).json({ success: false, message: "Алдаа" });
  }
};

exports.show = async (req, res) => {
  const { target, id } = req.params;
  const { select } = req;
  const model = config.targets[target] ? config.targets[target].model : null;
  try {
    if (model) {
      let modelSelect = {};
      getSelect(select, model, modelSelect);
      const data = await model.findOne({
        ...modelSelect,
        where: { [model.primaryKeyAttribute]: id },
      });
      return res.status(200).json({
        message: "Амжилттай",
        success: true,
        data: data,
      });
    } else {
      return res.status(200).json({
        message: "Хүснэгт олдсонгүй",
        success: false,
        data: null,
      });
    }
  } catch (error) {
    console.log("showError:", error);
    return res.status(200).json({ success: false, message: "Алдаа" });
  }
};

exports.create = async (req, res) => {
  const { by, at, phone_verified_at, phone_verify_deadline, ...body } = req.body; // баталгаажуулалт зөвхөн /phone-verify-ээр
  const { target } = req.params;
  const model = config.targets[target] ? config.targets[target].model : null;

  const t = await sequelize.transaction();
  try {
    if (model) {
      const item = await model
        .create({ ...body, created_by: by, created_at: at }, { transaction: t })
        .then(async (item) => await model.findByPk(item.id, { raw: true }));

      await saveLog(
        {
          object_name: target,
          object_id: item.id,
          log_action: "created",
          log_action_mn: "Үүсгэсэн",
          modify_data: JSON.stringify(body),
          created_by: by,
          created_at: at,
        },
        t,
      );

      await t.commit();
      return res.status(200).json({
        message: "Амжилттай",
        success: true,
        data: item,
      });
    } else {
      await t.rollback();
      return res.status(200).json({
        message: "Хүснэгт олдсонгүй",
        success: false,
        data: null,
      });
    }
  } catch (error) {
    await t.rollback();
    console.log("createError:", error);
    return res.status(200).json({
      success: false,
      data: null,
      message: typeof error === "string" ? error : "Алдаа",
    });
  }
};

exports.update = async (req, res) => {
  const { id, target } = req.params;
  const { by, at, phone_verified_at, phone_verify_deadline, ...body } = req.body; // баталгаажуулалт зөвхөн /phone-verify-ээр

  const t = await sequelize.transaction();
  try {
    const model = config.targets[target] ? config.targets[target].model : null;
    if (model) {
      const updateRow = await model.findByPk(id, {
        attributes: { exclude: ["password"] },
        raw: true,
      });
      const modifyData = Object.assign({}, body.modifyData);
      delete body.modifyData;
      await model.update(
        { ...body, updated_by: by, updated_at: at },
        { where: { id }, transaction: t, individualHooks: true },
      );
      await saveLog(
        {
          object_name: target,
          object_id: id,
          log_action: "updated",
          log_action_mn: "Шинэчилсэн",
          modify_data: JSON.stringify(modifyData),
          created_by: by,
          created_at: at,
        },
        t,
      );

      await t.commit();
      return res.status(200).json({
        message: "Амжилттай",
        success: true,
        data: updateRow,
      });
    } else {
      await t.rollback();
      return res.status(200).json({
        message: "Хүснэгт олдсонгүй",
        success: false,
        data: null,
      });
    }
  } catch (error) {
    await t.rollback();
    console.log("updateError:", error);
    return res.status(200).json({
      success: false,
      data: null,
      message: typeof error === "string" ? error : "Алдаа",
    });
  }
};

exports.destroy = async (req, res) => {
  const { target } = req.params;
  const { ids, by, at } = req.body;
  const model = config.targets[target] ? config.targets[target].model : null;

  const t = await sequelize.transaction();
  try {
    if (model && Array.isArray(ids)) {
      const deleteRows = await model.findAll({
        where: { id: ids },
        attributes: ["id"],
        raw: true,
      });
      if (deleteRows) {
        for (let i = 0; i < ids.length; i++) {
          let id = ids[i];
          if (model.softDelete) {
            await model.update(
              { deleted_by: by, deleted_at: at, status: "deleted" },
              {
                where: { id, status: { [op.ne]: "deleted" } },
                transaction: t,
                individualHooks: true,
              },
            );
          } else {
            await model.destroy({
              where: { id },
              transaction: t,
              individualHooks: true,
            });
          }
          await saveLog(
            {
              object_name: target,
              object_id: id,
              log_action: "deleted",
              log_action_mn: "Устгасан",
              created_by: by,
              created_at: at,
            },
            t,
          );
        }

        await t.commit();
        return res
          .status(200)
          .json({ message: "Амжилттай", success: true, data: { ids } });
      } else {
        await t.rollback();
        return res.status(200).json({
          message: "Устгах мэдээлэл олдсонгүй",
          success: true,
          data: { ids },
        });
      }
    } else {
      await t.rollback();
      return res
        .status(200)
        .json({ message: "Хүснэгт олдсонгүй", success: false, data: null });
    }
  } catch (error) {
    await t.rollback();
    console.log("destroyError:", error);
    return res.status(200).json({ success: false, message: "Алдаа" });
  }
};

exports.uploadFile = async (req, res) => {
  let result = { success: true, message: "Амжилттай", data: null };

  const { by, at } = req.body;
  try {
    const form = formidable({
      maxFileSize: 1000 * 1024 * 1024,
      maxFieldsSize: 1000 * 1024 * 1024,
      multiples: true,
      keepExtensions: true,
      uploadDir: path.join(__dirname, "../../tmpFile"),
    });

    let promiseData = null;
    let nowFiles = [];

    promiseData = await new Promise(function (resolve, reject) {
      form.parse(req, async function (error, fields, files) {
        if (error) reject(error);

        const dataInfo = JSON.parse(fields["dataInfo"]);
        const data_id = dataInfo.data_id;
        const object_name = dataInfo.object_name;
        if (data_id && object_name) {
          // Object Name folder is create
          const uploadPath = path.join(__dirname, "../../public/uploads");
          if (!fs.existsSync(uploadPath + "/" + object_name))
            fs.mkdirSync(uploadPath + "/" + object_name, { recursive: true });
          // odoo baigaa file-uudaa duudaj avah
          nowFiles = await allFiles.findAll({
            attributes: ["id", "object_name", "data_id", "field_name"],
            where: {
              object_name,
              data_id,
              field_name,
              status: { [op.ne]: "deleted" },
            },
            raw: true,
          });

          let notDeleteFiles = [];
          let fileCount = 0;
          if (fields) {
            for (const field in fields) {
              if (field !== "dataInfo" && field.indexOf("Info") > -1) {
                fileCount++;
                let fileInfo =
                  fields[field] !== "undefined" && JSON.parse(fields[field]);
                if (fileInfo) {
                  //not change file
                  if (fileInfo.id) {
                    if (
                      nowFiles.filter((s) => s.id === fileInfo.id).length === 1
                    )
                      notDeleteFiles.push(fileInfo.id);
                  } else {
                    //new file
                    const key = field.replace("Info", "");
                    const newFile = files[key];
                    if (newFile) {
                      const tempPath = newFile.filepath;
                      const fileType = getType(newFile.newFilename);
                      const randStr = str.random();
                      const fileName =
                        getDateNumbers() +
                        "_" +
                        randStr +
                        "_" +
                        fileCount +
                        "." +
                        fileType;

                      if (fs.existsSync(uploadPath + "/" + object_name)) {
                        fs.renameSync(
                          tempPath,
                          uploadPath + "/" + object_name + "/" + fileName,
                          function (error) {
                            if (error) throw error;
                          },
                        );

                        await allFiles.create({
                          object_name,
                          data_id,
                          // field_name: field_name,
                          extension: fileType,
                          size: newFile.size,
                          generated_name: fileName,
                          original_name: fileInfo.original_name,
                          order: fileCount,
                          status: "active",
                          created_by: by,
                          created_at: at,
                        });
                      } else {
                        result.success = false;
                        result.message = "Алдаа";
                        return res.status(200).json(result);
                      }
                    }
                  }
                }
              }
            }
          }
          // delete file
          for (let i = 0; i < nowFiles.length; i++) {
            if (
              notDeleteFiles.filter((s) => s + "" === nowFiles[i].id + "")
                .length === 0
            ) {
              allFiles.update(
                { status: "deleted", deleted_by: by, deleted_at: at },
                {
                  where: { id: nowFiles[i].id, status: { [op.ne]: "deleted" } },
                },
              );
            }
          }
        }
        resolve();
      });
    });
    result.data = { promiseData };
    return res.status(200).json(result);
  } catch (error) {
    console.error({ uploadFileError: error });
    result.success = false;
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const fileInfo = req.body.fileInfo ? JSON.parse(req.body.fileInfo) : null;
    if (fileInfo) {
      let downloadFile = null;
      if (fileInfo.generated_name && fileInfo.extension) {
        const dirPath = path.join(
          __dirname,
          "../../public/uploads/" + fileInfo.object_name + "/",
        );
        const filePath = dirPath + fileInfo.generated_name;
        if (fs.existsSync(filePath)) {
          const contentType = mime.contentType(fileInfo.extension);
          if (contentType)
            downloadFile = { uploadPath: filePath, contentType: contentType };
        }
      }
      if (downloadFile) {
        res.contentType(downloadFile.contentType);
        res.download(downloadFile.uploadPath);
        return;
      } else {
        return res.status(422).send(null);
      }
    } else {
      return res.status(422).send(null);
    }
  } catch (error) {
    console.error({ downloadFileError: error });
    return res.status(422).send(null);
  }
};
