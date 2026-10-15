import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/screens/detail.dart';
import 'package:mashinuud_app/screens/search.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

class ListScreen extends StatefulWidget {
  const ListScreen({
    super.key,
    this.title,
    this.searchQuery,
    this.minPrice,
    this.maxPrice,
    this.location,
    this.brand,
    this.bodyType,
    this.year,
    this.mileage,
    this.fuelType,
    this.driveType,
    this.transmission,
  });
  final String? title;
  final String? searchQuery;
  final double? minPrice;
  final double? maxPrice;
  final String? location;
  final String? brand;
  final String? bodyType;
  final String? year;
  final String? mileage;
  final String? fuelType;
  final String? driveType;
  final String? transmission;

  @override
  State<ListScreen> createState() => _ListScreenState();
}

/// Шүүлтүүрийн нэг утга (чип болж харагдана).
class _Filter {
  final String label;
  final bool Function(Car car) test;

  const _Filter(this.label, this.test);
}

class _ListScreenState extends State<ListScreen> {
  late final TextEditingController _query = TextEditingController(
    text: widget.searchQuery ?? '',
  );
  late final List<_Filter> _filters = _initialFilters();
  final Set<String> _favorites = {'4'};
  int _sort = 0;

  static bool _isSet(String? v) =>
      v != null && v.isNotEmpty && !v.startsWith('Бүх');

  List<_Filter> _initialFilters() {
    final w = widget;
    return [
      if (_isSet(w.brand)) _Filter(w.brand!, (c) => c.brand == w.brand),
      if (_isSet(w.bodyType))
        _Filter(w.bodyType!, (c) => c.bodyType == w.bodyType),
      if (_isSet(w.year))
        _Filter('${w.year}+', (c) => c.year >= (int.tryParse(w.year!) ?? 0)),
      if (_isSet(w.fuelType)) _Filter(w.fuelType!, (c) => c.fuel == w.fuelType),
      if (_isSet(w.transmission))
        _Filter(w.transmission!, (c) => c.transmission == w.transmission),
      if (_isSet(w.driveType)) _Filter(w.driveType!, (c) => c.drive == w.driveType),
      if ((w.minPrice ?? 0) > 0)
        _Filter('${formatPrice(w.minPrice!)}-с', (c) => c.price >= w.minPrice!),
      if (w.maxPrice != null && w.maxPrice! < 1000000000)
        _Filter('${formatPrice(w.maxPrice!)} хүртэл', (c) => c.price <= w.maxPrice!),
    ];
  }

  List<Car> get _results {
    final q = _query.text.trim().toLowerCase();
    final cars = carData.where((c) {
      if (q.isNotEmpty && !c.name.toLowerCase().contains(q)) return false;
      return _filters.every((f) => f.test(c));
    }).toList();
    if (_sort == 1) cars.sort((a, b) => a.price.compareTo(b.price));
    return cars;
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cars = _results;
    return Scaffold(
      backgroundColor: AppPalette.background,
      body: Column(
        children: [
          Container(
            color: AppPalette.surface,
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    child: Row(
                      children: [
                        SquareIconButton(
                          icon: Icons.chevron_left_rounded,
                          onTap: () => Navigator.pop(context),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            widget.title ?? 'Зарууд',
                            overflow: TextOverflow.ellipsis,
                            style: displayStyle(30),
                          ),
                        ),
                        SquareIconButton(
                          icon: Icons.notifications_none_rounded,
                          onTap: () {},
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: SearchField(
                      hint: 'Марк, загвар...',
                      controller: _query,
                      fill: AppPalette.background,
                      bordered: false,
                      onSubmitted: (_) => setState(() {}),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _filterChips(),
                  const SizedBox(height: 14),
                ],
              ),
            ),
          ),
          const Divider(height: 1, color: AppPalette.border),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 32),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${cars.length} зар олдлоо',
                        style: const TextStyle(
                          color: AppPalette.muted,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    SegmentedPicker(
                      options: const ['Шинэ эхэнд', 'Үнэ ↑'],
                      selected: _sort,
                      height: 48,
                      onChanged: (i) => setState(() => _sort = i),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (cars.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 60),
                    child: Center(
                      child: Text(
                        'Тохирох зар олдсонгүй',
                        style: TextStyle(color: AppPalette.muted, fontSize: 16),
                      ),
                    ),
                  ),
                for (final car in cars)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: CarListCard(
                      car: car,
                      favorite: _favorites.contains(car.id),
                      onFavorite: () => setState(() {
                        if (!_favorites.remove(car.id)) _favorites.add(car.id);
                      }),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChips() {
    return SizedBox(
      height: 46,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          Material(
            color: AppPalette.ink,
            shape: const StadiumBorder(),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SearchScreen()),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Row(
                  children: [
                    const Icon(Icons.tune_rounded, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      _filters.isEmpty
                          ? 'Шүүлтүүр'
                          : 'Шүүлтүүр · ${_filters.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          for (final f in _filters)
            Padding(
              padding: const EdgeInsets.only(left: 10),
              child: Material(
                color: AppPalette.surface,
                shape: const StadiumBorder(
                  side: BorderSide(color: AppPalette.primary, width: 1.5),
                ),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => setState(() => _filters.remove(f)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Text(
                          f.label,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.close_rounded, size: 18),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class CarListCard extends StatelessWidget {
  final Car car;
  final bool favorite;
  final VoidCallback? onFavorite;

  const CarListCard({
    super.key,
    required this.car,
    this.favorite = false,
    this.onFavorite,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      radius: 28,
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => DetailScreen(carId: car.id)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CarThumb(tint: car.tint, width: 112, height: 112, carWidth: 84),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (car.verified) ...[
                  const Row(
                    children: [
                      Icon(
                        Icons.verified_user_outlined,
                        size: 15,
                        color: AppPalette.green,
                      ),
                      SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          'Оношилгоотой',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: AppPalette.green,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                ],
                Text(
                  car.name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(car.summary, style: const TextStyle(color: AppPalette.muted)),
                const SizedBox(height: 4),
                Text(
                  '${car.location} · ${car.postedAgo}',
                  style: const TextStyle(color: AppPalette.muted),
                ),
                const SizedBox(height: 6),
                PriceText(car.priceLabel),
              ],
            ),
          ),
          GestureDetector(
            onTap: onFavorite,
            child: Icon(
              favorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              color: favorite ? AppPalette.red : AppPalette.ink,
              size: 26,
            ),
          ),
        ],
      ),
    );
  }
}
