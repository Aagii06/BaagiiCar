import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart'; // Зөвхөн хэдэн Cupertino widget ашиглах болно.

// Үндсэн Хуудасны Вижет
class SearchScreen extends StatefulWidget {
  const SearchScreen({Key? key}) : super(key: key);

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  // --- Төлөв Гэрчилгээ (State Management) ---
  final TextEditingController _searchController = TextEditingController();

  // Табын удирдлага (0: Шүүлтүүр, 1: Хадгалсан хайлт)
  int _selectedTabIndex = 0;

  // Үнийн шүүлтүүрийн төлөв
  double _minPrice = 0.0;
  double _maxPrice = 50000000.0;
  // Шинэ хувилбар дээр Slider-т заавал ValueNotifier эсвэл StatefulRangeSlider ашиглана.
  // Бид Stateful вижет ашиглаж байгаа учраас setState дуудна.

  // Унадаг цэсүүдийн төлөв
  String _selectedLocation = 'Бүх байршил';
  String _selectedBrand = 'Бүх бренд';
  String _selectedYear = 'Бүх он';
  String _selectedMileage = 'Бүх км';
  String _selectedFuelType = 'Бүх төрөл';
  String _selectedDriveType = 'Бүх төрөл';
  String _selectedTransmission = 'Бүх төрөл';

  // --- Туслах функцууд ---

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
              // Шүүлтүүрийг цэвэрлэх логик энд орно
              setState(() {
                _minPrice = 0.0;
                _maxPrice = 50000000.0;
                // Бусад төлөвийг анхны байдалд нь оруулна
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
        // Бүх контентийг гүйлгэж харах боломжтой болгоно
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          children: [
            const SizedBox(height: 10),

            // 1. Хайлтын Талбар (Search Bar)
            _buildSearchBar(),
            const SizedBox(height: 16),

            // 2. Таб Вижет (Segmented Control - Cupertino хэв маягаар)
            _buildTabSegment(),
            const SizedBox(height: 20),

            // 3. Үнийн Шүүлтүүр (Price Slider)
            _buildPriceSlider(),
            const SizedBox(height: 16),

            // 4. Бусад Шүүлтүүрүүд (Filter Dropdowns)
            _buildFilterRow('Байршил', _selectedLocation),
            _buildFilterRow('Бренд', _selectedBrand),
            _buildFilterRow('Он', _selectedYear),
            _buildFilterRow('Явсан км', _selectedMileage),
            _buildFilterRow('Шатахуун', _selectedFuelType),
            _buildFilterRow('Хөтлөгч', _selectedDriveType),
            _buildFilterRow('Хурдны хайрцаг', _selectedTransmission),
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
      decoration: BoxDecoration(
        color: Colors.grey[100], // Зөөлөн саарал дэвсгэр
        borderRadius: BorderRadius.circular(10),
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Хайх (бренд, загвар, түлхүүр үг)',
          hintStyle: TextStyle(color: Colors.grey[500]),
          prefixIcon: Icon(
            CupertinoIcons.search,
            color: Colors.grey[500],
          ), // Хайлтын дүрс
          border: InputBorder.none, // Текстийн хүрээг арилгах
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }

  // Таб сонгох вижет (Cupertino Segmented Control-ийг илүү хялбараар)
  Widget _buildTabSegment() {
    return Row(
      children: [
        // Зүүн талын таб (Шүүлтүүр)
        Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _selectedTabIndex = 0),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: _selectedTabIndex == 0
                        ? Colors.blue
                        : Colors.grey[200]!,
                    width: 2,
                  ),
                ),
              ),
              child: Text(
                'Шүүлтүүр',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: _selectedTabIndex == 0 ? Colors.blue : Colors.black,
                  fontWeight: _selectedTabIndex == 0
                      ? FontWeight.bold
                      : FontWeight.normal,
                ),
              ),
            ),
          ),
        ),
        // Баруун талын таб (Хадгалсан хайлт)
        Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _selectedTabIndex = 1),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: _selectedTabIndex == 1
                        ? Colors.blue
                        : Colors.grey[200]!,
                    width: 2,
                  ),
                ),
              ),
              child: Text(
                'Хадгалсан хайлт',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: _selectedTabIndex == 1 ? Colors.blue : Colors.black,
                  fontWeight: _selectedTabIndex == 1
                      ? FontWeight.bold
                      : FontWeight.normal,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Үнийн слайдер (Range Slider)
  Widget _buildPriceSlider() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Гарчиг болон утга харуулах
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Үнэ',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            Row(
              children: [
                Text(
                  _formatPrice(_minPrice),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const Text(' - ', style: TextStyle(color: Colors.grey)),
                Text(
                  _formatPrice(_maxPrice),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Range Slider вижет
        RangeSlider(
          values: RangeValues(_minPrice, _maxPrice),
          min: 0,
          max: 50000000,
          divisions: 100, // Утгыг алхамаар өөрчлөх
          activeColor: Colors.blue, // Сонгосон хэсгийн өнгө
          inactiveColor: Colors.blue.withOpacity(0.1), // Сонгоогүй хэсгийн өнгө
          labels: RangeLabels(
            _formatPrice(_minPrice),
            _formatPrice(_maxPrice),
          ), // Товчлуур дээрх текст
          onChanged: (RangeValues values) {
            setState(() {
              _minPrice = values.start;
              _maxPrice = values.end;
            });
          },
        ),
      ],
    );
  }

  // Унадаг цэсүүдийг үүсгэх мөр (Filter Row)
  Widget _buildFilterRow(String label, String value) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey[100]!),
        ), // Сүлжээний шугам
      ),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(
          label,
          style: const TextStyle(color: Colors.grey, fontSize: 14),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_right,
              color: Colors.grey[400],
              size: 20,
            ), // Сум
          ],
        ),
        onTap: () {
          // Унадаг цэсний логик энд орно (Жишээ нь: Шинэ хуудас нээх эсвэл Dialog харуулах)
          // Та энд CupertinoPicker эсвэл ModalBottomSheet ашиглаж болно.
        },
      ),
    );
  }

  // Харах товч (Bottom Button)
  Widget _buildViewResultsButton() {
    return SizedBox(
      width: double.infinity, // Бүрэн өргөнөөр
      height: 50,
      child: ElevatedButton(
        onPressed: () {
          // Хайх логик энд орно
          print('Хайлтын үр дүнг харах: ${_searchController.text}');
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blue, // Товчны өнгө
          elevation: 0, // Сүүдрийг арилгах
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        child: const Text(
          '1,245 зар харах', // Жишээ текст
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
