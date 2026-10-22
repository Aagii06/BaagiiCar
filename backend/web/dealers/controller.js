const { users, sequelize } = require("../../models");
const { roles, carStatuses } = require("../../config/constants");

// Идэвхтэй DEALER эрхтэй хэрэглэгчид, вэб дээр харагдах зарын тоотой нь.
// Имэйл, нууц үг гэх мэт хувийн талбарыг буцаахгүй.
module.exports.list = async (req, res) => {
  try {
    const carCount = sequelize.literal(
      `(SELECT COUNT(*) FROM cars WHERE cars.user_id = users.id AND cars.status = ${sequelize.escape(carStatuses.active)})`,
    );
    const rows = await users.findAll({
      where: { role: roles.dealer, status: "active" },
      attributes: ["id", "firstname", "lastname", "phonenumber", "logo", [carCount, "car_count"]],
      order: [[carCount, "DESC"], ["firstname", "ASC"]],
      raw: true,
    });
    return res.status(200).json({ success: true, data: { rows, count: rows.length }, message: "" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, data: { rows: [], count: 0 }, message: "Алдаа" });
  }
};
