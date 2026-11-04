const fs = require("fs");
const path = require("path");
const schedule = require("node-schedule");
const moment = require("moment");
const { cars, allFiles, sequelize, op } = require("../models");
const { carStatuses, carRestoreDays } = require("../config/constants");
const { saveLog } = require("../utils/logHelper");

// Устгасан (status = "deleted") зар carRestoreDays хоногийн дотор сэргээх боломжтой, дараа нь бүр мөсөн устна.
// Хадгалсан зар, үзэлтийн тоо FK-ийн CASCADE-аар, мессеж / чатын car_id SET NULL-аар; зургийг файлтай нь устгана.

const now = () => moment().utcOffset("+0800");
const format = (m) => m.format("YYYY-MM-DD HH:mm:ss");

// Үүнээс өмнө устгасан зар бүр мөсөн устах ёстой
const purgeDeadline = () => format(now().subtract(carRestoreDays, "days"));
module.exports.purgeDeadline = purgeDeadline;

const imageSizes = ["icon_", "thumb_", "grid_", ""];
const removeImages = async (names) => {
  const dir = path.join(__dirname, "../public/uploads/cars");
  for (const name of names)
    for (const prefix of imageSizes) await fs.promises.rm(path.join(dir, prefix + name), { force: true }).catch(console.log);
};

module.exports.runCarPurge = async () => {
  try {
    const stale = await cars.findAll({
      where: { status: carStatuses.deleted, deleted_at: { [op.ne]: null, [op.lt]: purgeDeadline() } },
      attributes: ["id", "code", "user_id", "dealer_id", "deleted_by", "deleted_at"],
      raw: true,
    });
    const at = format(now());
    for (const car of stale) {
      const t = await sequelize.transaction();
      try {
        const files = await allFiles.findAll({
          where: { object_name: "cars", data_id: car.id },
          attributes: ["generated_name"],
          raw: true,
          transaction: t,
        });
        await allFiles.destroy({ where: { object_name: "cars", data_id: car.id }, transaction: t });
        await cars.destroy({ where: { id: car.id }, transaction: t });
        await saveLog(
          {
            object_name: "cars",
            object_id: car.id,
            log_action: "purged",
            log_action_mn: `Устгаснаас хойш ${carRestoreDays} хоног өнгөрч бүр мөсөн устсан`,
            modify_data: JSON.stringify(car),
            created_at: at,
          },
          t,
        );
        await t.commit();
        await removeImages(files.map((f) => f.generated_name).filter(Boolean));
      } catch (error) {
        await t.rollback();
        console.log(`car purge: зар ${car.id} устгаж чадсангүй:`, error?.message || error);
      }
    }
    if (stale.length) console.log(`car purge: ${stale.length} зар бүр мөсөн устлаа`);
  } catch (error) {
    console.log("runCarPurge failed:", error);
  }
};

// Цаг тутам шалгана
module.exports.scheduleCarPurge = () => {
  const rule = new schedule.RecurrenceRule();
  rule.minute = 45;
  rule.tz = "Asia/Ulaanbaatar";
  schedule.scheduleJob(rule, module.exports.runCarPurge);
};
