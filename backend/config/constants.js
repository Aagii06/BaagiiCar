const constant = {
  // Хэрэглэгчийн эрх
  roles: {
    admin: "ADMIN",
    dealer: "DEALER",
    customer: "CUSTOMER",
  },

  // Машины зарын төлөв
  carStatuses: {
    // Админ биш хэрэглэгчийн шинэ зар админ батлах хүртэл вэб дээр гарахгүй
    pending: "pending",
    active: "active",
    sold: "sold",
    // Админ түр нуусан — вэб дээр харагдахгүй, дараа нь буцааж ил гаргаж болно
    hidden: "hidden",
    deleted: "deleted",
  },
  // Вэб (олон нийт) дээр харагдахгүй төлөвүүд
  nonPublicCarStatuses: ["pending", "hidden", "deleted"],

  fuelTypes: ["Бензин", "Дизель", "Хайбрид", "Газ", "Цахилгаан"],
  transmissions: ["Автомат", "Механик", "CVT", "Типтроник"],
  driveTypes: ["FWD", "RWD", "4WD"],
  steerings: ["Зүүн", "Баруун"],
};

module.exports = constant;
