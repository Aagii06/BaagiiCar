const schedule = require("node-schedule");

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
