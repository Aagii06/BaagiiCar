const { sequelize } = require("../models");

const sync = () => {
  sequelize.sync({
    alter: { drop: false },
    logging: (q) => console.log(q.replace("Executing (default):", "")),
  });
};

sync();
