const moment = require("moment");
const path = require("path");
const fs = require("fs");
const str = require("@supercharge/strings");

const { users, deliveries, sequelize, op } = require("../../models");

const {
  cyrillicToLatin,
  newDateWithoutTimezone,
  checkDatetimeIsBefore,
} = require("../../helper/helper");

const {
  getType,
  getDateNumbers,
  saveSharpConverter,
} = require("../../helper/fileHelper");
const { sendMail } = require("../../helper/mailHelper");

module.exports.testCyrillicToLatin = async (req, res) => {
  const word1 = req.query.word1;
  const word2 = req.query.word2;
  if (word1 && word2) {
    const convertedWord1 = await cyrillicToLatin(word1);
    const convertedWord2 = await cyrillicToLatin(word2);
    return res
      .status(200)
      .send(convertedWord1.slice(0, 1) + "." + convertedWord2);
  }
  return res.status(200).send(null);
};

module.exports.checkMomentIsBefore = async (req, res) => {
  let result = { success: true, expiredTime: null, data: null, message: "" };
  try {
    let date = moment().utcOffset("+0800").format("YYYY-MM-DD");
    let startTime = date + " 18:00";
    let expiredTime = date + " 00:20";
    if (
      !checkDatetimeIsBefore(
        newDateWithoutTimezone(startTime),
        newDateWithoutTimezone(expiredTime),
      )
    ) {
      date = moment(date)
        .add(1, "days")
        .utcOffset("+0800")
        .format("YYYY-MM-DD");
      expiredTime = date + " 00:20";
    }
    result.expiredTime = expiredTime;
    result.data = checkDatetimeIsBefore(
      newDateWithoutTimezone(startTime),
      newDateWithoutTimezone(expiredTime),
    );
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    result.success = false;
    result.data = error;
    result.message = "Алдаа";
    return res.status(200).send(result);
  }
};

module.exports.checkOrWhere = async (req, res) => {
  await users.findAll({
    where: { [op.or]: { role: "Admin" }, status: "active" },
    attrributes: ["id"],
    logging: (q) => console.log(q),
  });
  return res.status(200).json({ success: true });
};

module.exports.getLastId = async (req, res) => {
  const lastId = await deliveries.findAll({
    where: { status: { [op.ne]: "deleted" } },
    attributes: [[sequelize.fn("MAX", "id"), "max_id"]],
    group: ["apartment_id", "category_id"],
    logging: (q) => console.log(q),
  });
  return res.status(200).json({ lastId });
};

module.exports.sendMail = async (req, res) => {
  let result = { success: true, data: null, message: "Амжилттай" };
  try {
    await sendMail("sw10d239@gmail.com", {
      subject:
        "【○○マンションWEB工事用掲示板】お問い合わせいただきありがとうございます", // Subject line
      // text: "Hello world?", // plain text body
      html: "<p>このメールはシステムからの自動返信です。<br /><br /> △△様<br />お世話になっております。<br />工事に関するお問い合わせありがとうございました。<br /><br />以下の内容でお問い合わせを受付いたしました。<br /><br />回答にはお時間が掛かる場合がございますので、予めご容赦ください。<br /><br />▼お問い合わせ内容▼<br />---------------------------------------<br />お名前：<br />メールアドレス：<br />お問い合わせ日時：　年　月　日<br />お問い合わせいただいた内容：<br />---------------------------------------<br /><br />〜注）このメールは送信専用の為、返信しないようにしてください。〜 </p>", // html body
    });
    return res.status(200).json(result);
  } catch (ex) {
    result.success = false;
    result.data = ex;
    result.message = "Unsuccessfully";
    return res.status(200).json(result);
  }
};

module.exports.imageUpload = async (req, res) => {
  let result = { success: true, data: null, message: "Амжилттай" };
  try {
    const files = req.files;
    const newFile = files["file0"];
    if (newFile) {
      const tempPath = newFile.filepath;
      const fileType = getType(newFile.newFilename);
      const fileName = getDateNumbers() + "_" + str.random() + "." + fileType;
      const uploadPath = path.join(__dirname, "../../public/uploads/test");
      if (fs.existsSync(uploadPath))
        await saveSharpConverter(tempPath, uploadPath, fileName);
    }
    return res.status(200).json(result);
  } catch (ex) {
    console.log(ex);
    result.success = false;
    result.data = ex;
    result.message = "Unsuccessfully";
    return res.status(200).json(result);
  }
};

module.exports.scheduleExample = async (req, res) => {};
