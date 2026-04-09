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
    image: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  ),
  CarBodyType(
    id: 2,
    bodyType: "Sedan",
    image: "https://cdn-icons-png.flaticon.com/512/744/744470.png",
  ),
  CarBodyType(
    id: 3,
    bodyType: "Hatchback",
    image: "https://cdn-icons-png.flaticon.com/512/744/744474.png",
  ),
  CarBodyType(
    id: 4,
    bodyType: "Coupe",
    image: "https://cdn-icons-png.flaticon.com/512/744/744472.png",
  ),
  CarBodyType(
    id: 5,
    bodyType: "Convertible",
    image: "https://cdn-icons-png.flaticon.com/512/744/744476.png",
  ),
  CarBodyType(
    id: 6,
    bodyType: "Pickup",
    image: "https://cdn-icons-png.flaticon.com/512/744/744467.png",
  ),
  CarBodyType(
    id: 7,
    bodyType: "Van",
    image: "https://cdn-icons-png.flaticon.com/512/744/744469.png",
  ),
  CarBodyType(
    id: 8,
    bodyType: "Wagon",
    image: "https://cdn-icons-png.flaticon.com/512/744/744471.png",
  ),
  CarBodyType(
    id: 9,
    bodyType: "Minivan",
    image: "https://cdn-icons-png.flaticon.com/512/744/744468.png",
  ),
];
