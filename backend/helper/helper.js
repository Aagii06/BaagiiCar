const moment = require("moment");

const dateFormat = "YYYY-MM-DD";
const dateTimeFormat = "YYYY-MM-DD HH:mm:ss";
const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

module.exports.capitalize = (string) => {
  if (typeof string === "string")
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
  else return string;
};

module.exports.cyrillicToLatin = async (word) => {
  const convertLetters = [
    { mn: "А", en: "A" },
    { mn: "Б", en: "B" },
    { mn: "В", en: "V" },
    { mn: "Г", en: "G" },
    { mn: "Д", en: "D" },
    { mn: "Е", en: "YE" },
    { mn: "Ё", en: "YO" },
    { mn: "Ж", en: "J" },
    { mn: "З", en: "Z" },
    { mn: "И", en: "I" },
    { mn: "Й", en: "I" },
    { mn: "К", en: "K" },
    { mn: "Л", en: "L" },
    { mn: "М", en: "M" },
    { mn: "Н", en: "N" },
    { mn: "О", en: "O" },
    { mn: "Ө", en: "U" },
    { mn: "П", en: "P" },
    { mn: "Р", en: "R" },
    { mn: "С", en: "S" },
    { mn: "Т", en: "T" },
    { mn: "У", en: "U" },
    { mn: "Ү", en: "U" },
    { mn: "Ф", en: "F" },
    { mn: "Х", en: "KH" },
    { mn: "Ц", en: "TS" },
    { mn: "Ч", en: "CH" },
    { mn: "Ш", en: "SH" },
    { mn: "Щ", en: "SCH" },
    { mn: "Ъ", en: "I" },
    { mn: "Ь", en: "I" },
    { mn: "Ы", en: "Y" },
    { mn: "Э", en: "E" },
    { mn: "Ю", en: "YU" },
    { mn: "Я", en: "YA" },
    { mn: "а", en: "a" },
    { mn: "б", en: "b" },
    { mn: "в", en: "v" },
    { mn: "г", en: "g" },
    { mn: "д", en: "d" },
    { mn: "е", en: "ye" },
    { mn: "ё", en: "yo" },
    { mn: "ж", en: "j" },
    { mn: "з", en: "z" },
    { mn: "и", en: "i" },
    { mn: "й", en: "i" },
    { mn: "к", en: "k" },
    { mn: "л", en: "l" },
    { mn: "м", en: "m" },
    { mn: "н", en: "n" },
    { mn: "о", en: "o" },
    { mn: "ө", en: "u" },
    { mn: "п", en: "p" },
    { mn: "р", en: "r" },
    { mn: "с", en: "s" },
    { mn: "т", en: "t" },
    { mn: "у", en: "u" },
    { mn: "ү", en: "u" },
    { mn: "ф", en: "f" },
    { mn: "х", en: "kh" },
    { mn: "ц", en: "ts" },
    { mn: "ч", en: "ch" },
    { mn: "ш", en: "sh" },
    { mn: "щ", en: "sch" },
    { mn: "ъ", en: "i" },
    { mn: "ь", en: "i" },
    { mn: "ы", en: "y" },
    { mn: "э", en: "e" },
    { mn: "ю", en: "yu" },
    { mn: "я", en: "ya" },
    { mn: "-", en: "-" },
    { mn: " ", en: " " },
  ];

  const wordUpper =
    word && typeof word === "string"
      ? word.replaceAll(" ", "").toUpperCase()
      : null;
  let wordArray = wordUpper ? wordUpper.split("") : [];

  let convertedWord = "";

  if (wordArray.length > 0) {
    let index = 0;
    for (let i = 0; i < wordArray.length; i++) {
      index++;
      let coll = "";
      if (
        wordArray[index - 1] !== undefined &&
        wordArray[index] !== undefined
      ) {
        coll = wordArray[index - 1] + wordArray[index];
        if (
          coll === "ЯА" ||
          coll === "ЮУ" ||
          coll === "ЮҮ" ||
          coll === "ЁО" ||
          coll === "ЕЭ"
        )
          wordArray[index] = null;
      }
    }

    // Хөрвүүлэх
    wordArray.forEach((e) => {
      let con = "";
      let filterdArr = [];
      if (e) {
        filterdArr = convertLetters.filter((s) => s.mn === e.toLowerCase());
        con = filterdArr.length === 1 ? filterdArr[0].en : "";
        convertedWord += con;
      }
    });
  }
  return convertedWord;
};

module.exports.newDateWithoutTimezone = (date) =>
  moment.parseZone(date).toDate();

module.exports.getTime = (date) =>
  this.checkDate(date) ? moment(date).utcOffset("+0000").format("HH:mm") : null;

module.exports.differenceDateFromNow = (date, type = "months") => {
  let year = 0;
  let month = 0;
  if (this.checkDate(date, "date")) {
    const differenceDateFromNow = moment(new Date()).diff(
      new Date(date),
      type,
      true,
    );
    year = Math.floor(parseInt(differenceDateFromNow) / 12);
    month = Math.floor(parseInt(differenceDateFromNow) % 12);
  }
  return { year, month };
};

module.exports.differenceTime = (begin, end, type) => {
  let diff = 0;
  if (this.checkDate(begin) && this.checkDate(end)) {
    diff = moment(end, "HH:mm").diff(
      moment(begin, "HH:mm"),
      type ? type : "minutes",
    );
  }
  return diff;
};

module.exports.differenceDays = (begin, end, type) => {
  let diff = 0;
  if (this.checkDate(begin, "date") && this.checkDate(end, "date")) {
    diff = moment(end, "YYYY-MM-DD").diff(
      moment(begin, "YYYY-MM-DD"),
      type ? type : "days",
    );
  }
  return diff;
};

module.exports.checkDate = (date, type = "time") =>
  moment(date, type === "date" ? dateFormat : dateTimeFormat, true).isValid();

module.exports.checkTimeHM = (time) => timeRegex.test(time);

module.exports.checkTodayIsBefore = (date) =>
  moment(date).isBefore(
    moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss"),
    "day",
  );

module.exports.checkDatetimeIsBefore = (startDate, expiredDate) =>
  moment(startDate).isBefore(expiredDate);

module.exports.convertToHalf = (value) =>
  value.replace(/[！-～]/g, (halfwidthChar) =>
    String.fromCharCode(halfwidthChar.charCodeAt(0) - 0xfee0),
  );

module.exports.convertToFull = (value) =>
  value.replace(/[!-~]/g, (fullwidthChar) =>
    String.fromCharCode(fullwidthChar.charCodeAt(0) + 0xfee0),
  );

module.exports.convertCapitalize = (string) => {
  if (typeof string === "string")
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
  else return null;
};

module.exports.setJapanDate = (date) => {
  const tempDate = !isNaN(moment(date)) ? date : moment().format();
  let dateStr = "";
  const year = moment(tempDate).format("YYYY");
  const month = moment(tempDate).format("MM");
  const day = moment(tempDate).format("DD");
  dateStr = year + "年" + month + "月" + day + "日";
  return dateStr;
};

module.exports.isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

module.exports.parseExcelDate = (excelDate) => {
  const startDate = moment("1900-01-01"); // Excel-ийн эхний огноо
  const date = startDate.add(excelDate - 2, "days"); // 1900 оны 1-р сарын 1-ээс эхэлж 2 өдрийг хасна
  return date;
};

module.exports.randomNumber = () =>
  Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
