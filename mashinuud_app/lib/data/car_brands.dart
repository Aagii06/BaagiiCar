class CarBrand {
  final int? id;
  final String brand;
  final String country;
  final String logo;
  final bool asset;
  final int? count;

  const CarBrand({
    this.id = 0,
    this.count = 0,
    required this.brand,
    required this.country,
    required this.logo,
    this.asset = false,
  });
}

const List<CarBrand> carBrands = [
  CarBrand(
    brand: "Toyota",
    country: "Japan",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/toyota&w=128&h=128",
  ),
  CarBrand(
    brand: "Honda",
    country: "Japan",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/honda&w=128&h=128",
  ),
  CarBrand(
    brand: "Nissan",
    country: "Japan",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/nissan&w=128&h=128",
  ),
  CarBrand(
    brand: "Lexus",
    country: "Japan",
    logo: "assets/logos/lexus.jpg",
    asset: true,
  ),
  CarBrand(
    brand: "Mazda",
    country: "Japan",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/mazda&w=128&h=128",
  ),
  CarBrand(
    brand: "Subaru",
    country: "Japan",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/subaru&w=128&h=128",
  ),
  CarBrand(
    brand: "Suzuki",
    country: "Japan",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/suzuki&w=128&h=128",
  ),
  CarBrand(
    brand: "Mitsubishi",
    country: "Japan",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/mitsubishi&w=128&h=128",
  ),
  CarBrand(
    brand: "Mercedes-Benz",
    country: "Germany",
    logo:
        "https://images.weserv.nl/?url=cdn.jsdelivr.net/npm/simple-icons@latest/icons/mercedes.svg&w=128&h=128",
  ),
  CarBrand(
    brand: "BMW",
    country: "Germany",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/bmw&w=128&h=128",
  ),
  CarBrand(
    brand: "Audi",
    country: "Germany",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/audi&w=128&h=128",
  ),
  CarBrand(
    brand: "Volkswagen",
    country: "Germany",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/volkswagen&w=128&h=128",
  ),
  CarBrand(
    brand: "Porsche",
    country: "Germany",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/porsche&w=128&h=128",
  ),
  CarBrand(
    brand: "Hyundai",
    country: "South Korea",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/hyundai&w=128&h=128",
  ),
  CarBrand(
    brand: "Kia",
    country: "South Korea",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/kia&w=128&h=128",
  ),
  CarBrand(
    brand: "Tesla",
    country: "USA",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/tesla&w=128&h=128",
  ),
  CarBrand(
    brand: "Ford",
    country: "USA",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/ford&w=128&h=128",
  ),
  CarBrand(
    brand: "Chevrolet",
    country: "USA",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/chevrolet&w=128&h=128",
  ),
  CarBrand(
    brand: "Jeep",
    country: "USA",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/jeep&w=128&h=128",
  ),
  CarBrand(
    brand: "Land Rover",
    country: "United Kingdom",
    logo:
        "https://icons.iconarchive.com/icons/simpleicons-team/simple/128/landrover-icon.png",
  ),
  CarBrand(
    brand: "Bentley",
    country: "United Kingdom",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/bentley&w=128&h=128",
  ),
  CarBrand(
    brand: "Ferrari",
    country: "Italy",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/ferrari&w=128&h=128",
  ),
  CarBrand(
    brand: "Lamborghini",
    country: "Italy",
    logo:
        "https://images.weserv.nl/?url=cdn.simpleicons.org/lamborghini&w=128&h=128",
  ),
  CarBrand(
    brand: "Volvo",
    country: "Sweden",
    logo: "https://images.weserv.nl/?url=cdn.simpleicons.org/volvo&w=128&h=128",
  ),
  CarBrand(
    brand: "BYD",
    country: "China",
    logo: "assets/logos/byd.png",
    asset: true,
  ),
];
