"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const { Op } = Sequelize;
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];

const db = {};
const notUseDir = [
  // path.join(__dirname, "generated"),
  // path.join(__dirname, "out"),
];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: {
      requestTimeout: 15000,
      // options: { requestTimeout: 15000 },
      dateStrings: true,
      typeCast: true,
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    // logging: false,
    //(q) => console.log(q + "\n\n"),
    pool: { max: 30, min: 0, acquire: 60000, idle: 5000 },
  },
);

const getFiles = (dir, files_) => {
  if (notUseDir.includes(dir)) return files_;
  files_ = files_ || [];
  let files = fs.readdirSync(dir);
  for (let i in files) {
    let name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) getFiles(name, files_);
    else files_.push(name);
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
    const model = require(file)(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(async (modelName) => {
  const content = `const { ${modelName} } = require("../../../models");
    const { genrateType } = require("../../../utils/graphqlHelper");
    module.exports = {
      model: ${modelName},
      type: genrateType(${modelName}),
    };
    `;

  const content1 = `const { ${modelName} } = require("../../../models");
    const { body } = require("express-validator");
    
    const list = (req, res, next)  =>  {
      next();
    };
    
    const show = (req, res, next) => {
      next();
    };
    
    const lookup = (req, res, next) => {
      next();
    };
    
    const create = (req, res, next) => {
      next();
    };
    
    const update = (req, res, next) => {
      next();
    };

    const sync = (req, res, next) => {
      next();
    };
    
    module.exports = {
      model: ${modelName},
      middleware: { show, list, create, update, lookup, sync },
      validation: {},
    };    
    `;
  //fs.writeFileSync(path.join(__dirname, `/out/${modelName}.js`), content1);

  if (db[modelName].associate) db[modelName].associate(db);
  if (db[modelName].addHooks) db[modelName].addHooks(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.op = Op;

module.exports = db;
