const moment = require("moment");
const { phoneVerifyDays } = require("../config/constants");

// Утас баталгаажуулах эцсийн хугацаа (одооноос phoneVerifyDays хоног). models-оос дуудна тул models-ийг require хийхгүй.
module.exports.phoneVerifyDeadline = () =>
  moment().utcOffset("+0800").add(phoneVerifyDays, "days").format("YYYY-MM-DD HH:mm:ss");
