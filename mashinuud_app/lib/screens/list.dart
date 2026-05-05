import 'package:flutter/material.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/screens/detail.dart';

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
        leadingWidth: 160, // Товчлуурыг илүү урт болгохын тулд өргөнийг нэмэв
        leading: TextButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.filter_list),
          label: const Text("Шүүлтүүр"),
          style: TextButton.styleFrom(
            foregroundColor: Colors.black,
            alignment: Alignment.centerLeft, // Текстийг зүүн тал руу шахах
            padding: const EdgeInsets.only(left: 16),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                "1,245 олдсон зар",
                style: const TextStyle(fontSize: 13, color: Colors.grey),
              ),
            ),
          ),
        ],
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
          // List
          Expanded(
            child: ListView.builder(
              itemCount: carData.length,
              itemBuilder: (context, index) {
                final car = carData[index];
                return CarItem(car: car);
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomAppBar(
        padding: EdgeInsets.zero,
        height: 38,
        child: Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: () {
                  print("Шинэ эхэнд эрэмбэлэх");
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Text(
                      "Шинэ эхэнд",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
            const VerticalDivider(width: 1, indent: 5, endIndent: 5),
            Expanded(
              child: InkWell(
                onTap: () {
                  print("Хямд үнээр эрэмбэлэх");
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.swap_vert, color: Colors.grey),
                    SizedBox(width: 8),
                    Text("Хямд", style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ),
          ],
        ),
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
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      padding: EdgeInsets.zero,
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DetailScreen(carId: car["id"]!),
            ),
          );
        },
        child: Row(
          children: [
            Image.asset(
              car["image"]!,
              width: 110,
              height: 90,
              fit: BoxFit.cover,
            ),

            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      car["name"]!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      car["price"]!,
                      style: const TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: IconButton(
                onPressed: () {
                  print("Favorite-д нэмлээ");
                },
                icon: const Icon(Icons.favorite_border, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
