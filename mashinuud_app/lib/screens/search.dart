import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:mashinuud_app/widgets/custom/filterRow.dart';

import 'package:mashinuud_app/screens/list.dart'; // ListScreen-ийг импортлох
import 'package:mashinuud_app/data/filter_data.dart';

// Үндсэн Хуудасны Вижет
class SearchScreen extends StatefulWidget {
  const SearchScreen({Key? key}) : super(key: key);

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();

  // Табын удирдлага (0: Шүүлтүүр, 1: Хадгалсан хайлт)
  // int _selectedTabIndex = 0;

  double _minPrice = 0.0;
  double _maxPrice = 1000000000.0;

  // Унадаг цэсүүдийн төлөв
  String _selectedLocation = 'Бүх байршил';
  String _selectedBrand = 'Бүх бренд';
  String _selectedYear = 'Бүх он';
  String _selectedMileage = 'Бүх км';
  String _selectedFuelType = 'Бүх төрөл';
  String _selectedDriveType = 'Бүх төрөл';
  String _selectedTransmission = 'Бүх төрөл';

  // --- Туслах функцууд ---

  // Шүүлтүүр дээр дарах үед ажиллах функц
  void _onFilterTap(String typeName, String value) {
    setState(() {
      switch (typeName) {
        case 'location':
          _selectedLocation = value;
          break;
        case 'brand':
          _selectedBrand = value;
          break;
        case 'year':
          _selectedYear = value;
          break;
        case 'mileage':
          _selectedMileage = value;
          break;
        case 'fuel':
          _selectedFuelType = value;
          break;
        case 'drive':
          _selectedDriveType = value;
          break;
        case 'transmission':
          _selectedTransmission = value;
          break;
      }
    });
    print('Selected filter type: $typeName, value: $value');
  }

  // Тоон утгыг валют формат руу хөрвүүлэх (Жишээ: 50000000 -> 50,000,000₮)
  String _formatPrice(double price) {
    String formatted = price
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return '$formatted₮';
  }

  // --- Вижет Мод (Widget Tree) ---

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // Үндсэн дэвсгэр өнгө цагаан
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0, // AppBar-ийн сүүдрийг арилгах
        title: const Text(
          'Хайлт',
          style: TextStyle(
            color: Colors.black,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _minPrice = 0.0;
                _maxPrice = 1000000000.0;
                _selectedLocation = "Бүх байршил";
                _selectedBrand = "Бүх бренд";
                _selectedYear = "Бүх он";
                _selectedMileage = "Бүх км";
                _selectedFuelType = "Бүх төрөл";
                _selectedDriveType = "Бүх төрөл";
                _selectedTransmission = "Бүх төрөл";
              });
            },
            child: const Text(
              'Цэвэрлэх',
              style: TextStyle(color: Colors.blue, fontSize: 16),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 10),

            // 1. Хайлтын Талбар (Search Bar)
            _buildSearchBar(),
            const SizedBox(height: 16),

            // 2. Таб Вижет (Segmented Control - Cupertino хэв маягаар)
            // _buildTabSegment(),
            // const SizedBox(height: 20),

            // 3. Үнийн Шүүлтүүр (Price Slider)
            _buildPriceSlider(),
            const SizedBox(height: 16),

            // 4. Бусад Шүүлтүүрүүд (Filter Dropdowns)
            FilterRow(
              label: 'Байршил',
              value: _selectedLocation,
              typeName: 'location',
              options: FilterData.locations,
              onChanged: _onFilterTap,
            ),
            FilterRow(
              label: 'Бренд',
              value: _selectedBrand,
              typeName: 'brand',
              options: FilterData.brands,
              onChanged: _onFilterTap,
            ),
            FilterRow(
              label: 'Он',
              value: _selectedYear,
              typeName: 'year',
              options: FilterData.years,
              onChanged: _onFilterTap,
            ),
            FilterRow(
              label: 'Явсан км',
              value: _selectedMileage,
              typeName: 'mileage',
              options: FilterData.mileages,
              onChanged: _onFilterTap,
            ),
            FilterRow(
              label: 'Шатахуун',
              value: _selectedFuelType,
              typeName: 'fuel',
              options: FilterData.fuelTypes,
              onChanged: _onFilterTap,
            ),
            FilterRow(
              label: 'Хөтлөгч',
              value: _selectedDriveType,
              typeName: 'drive',
              options: FilterData.driveTypes,
              onChanged: _onFilterTap,
            ),
            FilterRow(
              label: 'Хурдны хайрцаг',
              value: _selectedTransmission,
              typeName: 'transmission',
              options: FilterData.transmissions,
              onChanged: _onFilterTap,
            ),
            const SizedBox(height: 30),

            // 5. Харах Товч (Bottom Action Button)
            _buildViewResultsButton(),
            const SizedBox(height: 30), // Доод талын зай
          ],
        ),
      ),
    );
  }

  // --- Кодын Хэсгүүд (Modular Widgets) ---

  // Хайлтын талбар
  Widget _buildSearchBar() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.grey[100], // Зөөлөн саарал дэвсгэр
        borderRadius: BorderRadius.circular(10),
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Хайх (бренд, загвар, түлхүүр үг)',
          hintStyle: TextStyle(color: Colors.grey[500]),
          prefixIcon: Icon(Icons.search, color: Colors.grey[500]),
          border: InputBorder.none, // Текстийн хүрээг арилгах
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }

  // Таб сонгох вижет (Cupertino Segmented Control-ийг илүү хялбараар)
  // Widget _buildTabSegment() {
  //   return Row(
  //     children: [
  //       // Зүүн талын таб (Шүүлтүүр)
  //       Expanded(
  //         child: GestureDetector(
  //           onTap: () => setState(() => _selectedTabIndex = 0),
  //           child: Container(
  //             padding: const EdgeInsets.symmetric(vertical: 12),
  //             decoration: BoxDecoration(
  //               border: Border(
  //                 bottom: BorderSide(
  //                   color: _selectedTabIndex == 0
  //                       ? Colors.blue
  //                       : Colors.grey[200]!,
  //                   width: 2,
  //                 ),
  //               ),
  //             ),
  //             child: Text(
  //               'Шүүлтүүр',
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 color: _selectedTabIndex == 0 ? Colors.blue : Colors.black,
  //                 fontWeight: _selectedTabIndex == 0
  //                     ? FontWeight.bold
  //                     : FontWeight.normal,
  //               ),
  //             ),
  //           ),
  //         ),
  //       ),
  //       // Баруун талын таб (Хадгалсан хайлт)
  //       Expanded(
  //         child: GestureDetector(
  //           onTap: () => setState(() => _selectedTabIndex = 1),
  //           child: Container(
  //             padding: const EdgeInsets.symmetric(vertical: 12),
  //             decoration: BoxDecoration(
  //               border: Border(
  //                 bottom: BorderSide(
  //                   color: _selectedTabIndex == 1
  //                       ? Colors.blue
  //                       : Colors.grey[200]!,
  //                   width: 2,
  //                 ),
  //               ),
  //             ),
  //             child: Text(
  //               'Хадгалсан хайлт',
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 color: _selectedTabIndex == 1 ? Colors.blue : Colors.black,
  //                 fontWeight: _selectedTabIndex == 1
  //                     ? FontWeight.bold
  //                     : FontWeight.normal,
  //               ),
  //             ),
  //           ),
  //         ),
  //       ),
  //     ],
  //   );
  // }

  Widget _buildPriceSlider() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Үнэ (₮)',
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
          RangeSlider(
            values: RangeValues(_minPrice, _maxPrice),
            min: 0,
            max: 1000000000,
            divisions: 100,
            labels: RangeLabels(
              _formatPrice(_minPrice),
              _formatPrice(_maxPrice),
            ),
            onChanged: (RangeValues values) {
              setState(() {
                _minPrice = values.start;
                _maxPrice = values.end;
              });
            },
          ),
        ],
      ),
    );
  }

  // Харах товч (Bottom Button)
  Widget _buildViewResultsButton() {
    return Padding(
      padding: EdgeInsetsGeometry.symmetric(horizontal: 8),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ListScreen(
                  searchQuery: _searchController.text,
                  minPrice: _minPrice,
                  maxPrice: _maxPrice,
                  location: _selectedLocation,
                  brand: _selectedBrand,
                  year: _selectedYear,
                  mileage: _selectedMileage,
                  fuelType: _selectedFuelType,
                  driveType: _selectedDriveType,
                  transmission: _selectedTransmission,
                ),
              ),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: const Text(
            '1,245 зар харах',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }
}
