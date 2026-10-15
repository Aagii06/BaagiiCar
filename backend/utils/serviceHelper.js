const schedule = require("node-schedule");
const moment = require("moment");

const {
  organizations,
  warehouseProducts,
  sequelize,
  op,
} = require("../models");

module.exports.scheduleBackUp = async () => {
  schedule.scheduleJob("0 0 3 * * *", async function () {
    try {
      // const backup = await backups.create({});
      // sequelize
      //   .query("EXEC spFullBackup @backUpId=" + backup.id)
      //   .then(async (item) => {})
      //   .catch((err) => {
      //     backup.status = 0;
      //     backup.created_at = new Date().toISOString();
      //     backup.save();
      //   });
    } catch (error) {
      console.log("BackUp ERROR:", error);
    }
  });
};

module.exports.scheduleWarehouseStatus = async () => {
  schedule.scheduleJob("0 0 4 * * *", async function () {
    try {
      const now = moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
      const afterWeek = moment()
        .utcOffset("+0800")
        .add(7, "days")
        .format("YYYY-MM-DD HH:mm:ss");
      const expiredRows = await organizations.findAll({
        where: { is_warehouse: true, warehouse_expired_date: { [op.lt]: now } },
        attributes: ["id"],
        raw: true,
      });
      const approachRows = await organizations.findAll({
        where: {
          is_warehouse: true,
          warehouse_expired_date: { [op.gte]: now, [op.lt]: afterWeek },
        },
        attributes: ["id"],
        raw: true,
      });

      const expiredIds = expiredRows.map((s) => s.id);
      const approachIds = approachRows.map((s) => s.id);

      if (expiredIds.length > 0) {
        await warehouseProducts.update(
          { organization_status: "Хугацаа дууссан" },
          { where: { organization_id: expiredIds } },
        );
      }
      if (approachIds.length > 0) {
        await warehouseProducts.update(
          { organization_status: "Хугацаа тулсан" },
          { where: { organization_id: approachIds } },
        );
      }
    } catch (error) {
      console.log(error);
    }
  });
};
