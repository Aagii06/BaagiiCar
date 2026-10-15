const constant = {
  // Хэрэглэгчийн эрх
  roles: {
    admin: "Админ",
    dealer: "Дилер",
    customer: "Хэрэглэгч",
  },

  // Машины зарын төлөв
  carStatuses: {
    active: "active",
    sold: "sold",
    deleted: "deleted",
  },

  fuelTypes: ["Бензин", "Дизель", "Хайбрид", "Газ", "Цахилгаан"],
  transmissions: ["Автомат", "Механик", "CVT", "Типтроник"],
  driveTypes: ["FWD", "RWD", "4WD", "AWD"],
  steerings: ["Зүүн", "Баруун"],
};

module.exports = constant;
