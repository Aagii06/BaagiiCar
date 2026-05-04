import 'package:flutter/material.dart';

class ListScreen extends StatefulWidget {
  const ListScreen({
    super.key,
    this.searchQuery,
    this.minPrice,
    this.maxPrice,
    this.location,
    this.brand,
    this.year,
    this.mileage,
    this.fuelType,
    this.driveType,
    this.transmission,
  });
  final String? searchQuery;
  final double? minPrice;
  final double? maxPrice;
  final String? location;
  final String? brand;
  final String? year;
  final String? mileage;
  final String? fuelType;
  final String? driveType;
  final String? transmission;

  @override
  State<ListScreen> createState() => _ListScreenState();
}

class _ListScreenState extends State<ListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, String>> cars = [
    {
      "name": "Toyota Prius 2018",
      "price": "19,500,000₮",
      "image": "assets/no-car.jpg",
    },
    {
      "name": "Lexus RX 350 2019",
      "price": "45,000,000₮",
      "image": "assets/no-car.jpg",
    },
    {
      "name": "Hyundai Tucson 2017",
      "price": "23,000,000₮",
      "image": "assets/no-car.jpg",
    },
  ];

  @override
  void initState() {
    _tabController = TabController(length: 2, vsync: this);
    // Дамжуулсан хайлтын утгуудыг хэвлэж үзэх (тест хийх зорилгоор)
    print('ListScreen received search query: ${widget.searchQuery}');
    print('ListScreen received min price: ${widget.minPrice}');
    print('ListScreen received max price: ${widget.maxPrice}');
    print('ListScreen received location: ${widget.location}');
    print('ListScreen received brand: ${widget.brand}');
    print('ListScreen received year: ${widget.year}');
    print('ListScreen received mileage: ${widget.mileage}');
    print('ListScreen received fuelType: ${widget.fuelType}');
    print('ListScreen received driveType: ${widget.driveType}');
    print('ListScreen received transmission: ${widget.transmission}');

    // Энд та дамжуулсан утгуудыг ашиглан жагсаалтыг шүүх логикийг нэмж болно.
    super.initState();
  }

  @override
  void dispose() {
    _tabController.dispose(); // Санах ойг чөлөөлөх
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text("Хайлт"),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: "Жагсаалт"),
            Tab(text: "Газрын зураг"),
          ],
          labelColor: Colors.black,
        ),
      ),
      body: Column(
        children: [
          // Filter хэсэг
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                const Text("1,245 олдсон зар"),
                const Spacer(),
                TextButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.filter_list),
                  label: const Text("Шүүлтүүр"),
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: ListView.builder(
              itemCount: cars.length,
              itemBuilder: (context, index) {
                final car = cars[index];
                return CarItem(car: car);
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.fiber_new),
            label: "Шинэ эхэнд",
          ),
          BottomNavigationBarItem(icon: Icon(Icons.swap_vert), label: "Хямд"),
        ],
      ),
    );
  }
}

class CarItem extends StatelessWidget {
  final Map<String, String> car;

  const CarItem({super.key, required this.car});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.asset(
              car["image"]!, // Network-ийн оронд Asset ашиглах
              width: 90,
              height: 70,
              fit: BoxFit.cover,
            ),
          ),

          const SizedBox(width: 10),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  car["name"]!,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  car["price"]!,
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          // Favorite icon
          const Icon(Icons.favorite_border),
        ],
      ),
    );
  }
}
