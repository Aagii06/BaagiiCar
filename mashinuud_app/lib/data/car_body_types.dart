class CarBodyType {
  final int? id;
  final String bodyType;
  final String image;
  final bool asset;
  final int? count;

  const CarBodyType({
    this.id = 0,
    this.count = 0,
    required this.bodyType,
    required this.image,
    this.asset = false,
  });
}

const List<CarBodyType> carBodyTypes = [
  CarBodyType(
    id: 1,
    bodyType: "SUV",
    image: "https://img.icons8.com/ios-filled/100/suv.png",
  ),
  CarBodyType(
    id: 2,
    bodyType: "Sedan",
    image: "https://img.icons8.com/ios-filled/100/sedan.png",
  ),
  CarBodyType(
    id: 3,
    bodyType: "Hatchback",
    image: "https://img.icons8.com/ios-filled/100/hatchback.png",
  ),
  CarBodyType(
    id: 4,
    bodyType: "Coupe",
    image: "https://img.icons8.com/ios-filled/100/coupe.png",
  ),
  CarBodyType(
    id: 5,
    bodyType: "Pickup",
    image: "https://img.icons8.com/ios-filled/100/pickup.png",
  ),
  CarBodyType(
    id: 6,
    bodyType: "Van",
    image: "https://img.icons8.com/ios-filled/100/van.png",
  ),
  CarBodyType(
    id: 7,
    bodyType: "Wagon",
    image: "https://img.icons8.com/ios-filled/100/station-wagon.png",
  ),
  CarBodyType(
    id: 8,
    bodyType: "Convertible",
    image: "https://img.icons8.com/ios-filled/100/convertible.png",
  ),
];
