const constant = {
  // Хэрэглэгчийн эрх
  roles: {
    admin: "ADMIN",
    dealer: "DEALER",
    customer: "CUSTOMER",
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
