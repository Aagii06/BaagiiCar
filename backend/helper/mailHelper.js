const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

// local хэсэг: 1-64 тэмдэгт, цэгээр эхлэх/төгсөх болон ".." хориотой
// домэйн: label бүр 1-63 тэмдэгт, "-"-ээр эхлэх/төгсөхгүй, TLD үсгээр эхэлнэ
const emailRegex =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9!#$%&'*+\/=?^_`{|}~.-]{1,64}(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z][A-Za-z0-9-]{0,61}[A-Za-z0-9]$/;

const isValidEmail = (email) =>
  typeof email === "string" && email.length <= 254 && emailRegex.test(email);

module.exports.isValidEmail = isValidEmail;

module.exports.sendMail = (mail, data) => {
  const user = process.env.MAIL_USER_NAME;
  const pass = process.env.MAIL_USER_PASS;

  try {
    if (isValidEmail(mail)) {
      const transporter = nodemailer.createTransport(
        smtpTransport({
          service: "Gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          logger: true,
          debug: true,
          tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
          auth: { user, pass },
        }),
      );

      return transporter.sendMail({ from: user, to: mail, ...data });
    } else {
      return null;
    }
  } catch (ex) {
    return null;
  }
};
