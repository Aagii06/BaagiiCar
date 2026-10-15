const fs = require("fs");
const path = require("path");
const { validate } = require("../../../utils/validationHelper");
const basename = path.basename(__filename);

const targets = {};
const notUseDir = [];

const getFiles = (dir, files_) => {
  if (notUseDir.includes(dir)) {
    return files_;
  }
  files_ = files_ || [];
  const files = fs.readdirSync(dir);
  for (let i in files) {
    const name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
};

getFiles(__dirname)
  .filter((filePath) => {
    const file = path.basename(filePath);
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const config = require(file);
    targets[config.target ? config.target : config.model.name] = config;
  });

module.exports.targets = targets;

module.exports.validate = (action) => (req, res, next) => {
  const target = req.params.target;
  if (!target) {
    return res.status(200).json({
      success: false,
      message: "Хүснэгтийн нэр хоосон байна",
    });
  } else if (target && targets[target]) {
    if (targets[target].validation && targets[target].validation[action]) {
      return validate(targets[target].validation[action])(req, res, next);
    }
    return next();
  }
  return next();
};

module.exports.middleware = (action) => (req, res, next) => {
  const target = req.params.target;
  if (!target) {
    return res.status(200).json({
      success: false,
      message: "Хүснэгтийн нэр хоосон байна",
    });
  } else if (target && targets[target]) {
    if (targets[target].middleware && targets[target].middleware[action]) {
      return targets[target].middleware[action](req, res, next);
    }
    return res.status(200).json({ success: false, message: "Passive action" });
  }
  return next();
};
