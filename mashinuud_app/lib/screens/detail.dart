import 'package:flutter/material.dart';
import 'package:mashinuud_app/data/car_data.dart';

class DetailScreen extends StatefulWidget {
  final String carId;

  const DetailScreen({super.key, required this.carId});

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  @override
  Widget build(BuildContext context) {
    final car = carData.firstWhere(
      (c) => c["id"] == widget.carId,
      orElse: () => carData.first,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          // 🔥 IMAGE + OVERLAY
          Stack(
            children: [
              Image.asset(
                car["image"]!,
                height: 460,
                width: double.infinity,
                fit: BoxFit.cover,
              ),

              // top icons
              Positioned(
                top: 40,
                left: 16,
                child: GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: _circleIcon(Icons.arrow_back),
                ),
              ),
              Positioned(
                top: 40,
                right: 16,
                child: _circleIcon(Icons.info_outline),
              ),

              // image count
              Positioned(
                bottom: 10,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    "1/20",
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ],
          ),

          // 🔥 CONTENT
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title + icons
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          car["name"]!,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const Icon(Icons.favorite_border),
                      const SizedBox(width: 10),
                      const Icon(Icons.share),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Price + badge
                  Row(
                    children: [
                      Text(
                        car["price"]!,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green[100],
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          "Яаралтай",
                          style: const TextStyle(color: Colors.green),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // 🔥 INFO GRID
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _InfoItem(icon: Icons.speed, label: car["mileage"]!),
                      _InfoItem(
                        icon: Icons.local_gas_station,
                        label: car["fuel"]!,
                      ),
                      _InfoItem(
                        icon: Icons.settings,
                        label: car["transmission"]!,
                      ),
                      _InfoItem(
                        icon: Icons.directions_car,
                        label: car["drive"]!,
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Location
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Text(car["location"]!),
                      const SizedBox(width: 10),
                      Text(car["date"]!, style: TextStyle(color: Colors.grey)),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Description
                  const Text(
                    "Тодорхойлолт",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    car["description"]!,
                    style: const TextStyle(color: Colors.black87),
                  ),
                ],
              ),
            ),
          ),

          // 🔥 BOTTOM BUTTONS
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Colors.grey)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {},
                    child: const Text("Зар руу залгах"),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    child: const Text("Чат бичих"),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Widget _circleIcon(IconData icon) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black45,
        borderRadius: BorderRadius.circular(30),
      ),
      padding: const EdgeInsets.all(8),
      child: Icon(icon, color: Colors.white),
    );
  }
}

// жижиг info item widget
class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: Colors.grey),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}
