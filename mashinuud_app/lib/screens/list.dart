import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/data/car_filter.dart';
import 'package:mashinuud_app/screens/detail.dart';
import 'package:mashinuud_app/screens/search.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

class ListScreen extends StatefulWidget {
  const ListScreen({super.key, this.title, this.query = const CarQuery()});

  final String? title;
  final CarQuery query;

  @override
  State<ListScreen> createState() => _ListScreenState();
}

class _ListScreenState extends State<ListScreen> {
  late CarQuery _query = widget.query;
  late final TextEditingController _search = TextEditingController(
    text: widget.query.query,
  );
  final Set<String> _favorites = {'4'};
  int _sort = 0;
  bool _map = false;
  Car? _selectedPin;

  List<Car> get _results {
    final cars = _query.apply(carData);
    if (_sort == 1) cars.sort((a, b) => a.price.compareTo(b.price));
    return cars;
  }

  void _setQuery(CarQuery q) => setState(() {
    _query = q;
    _selectedPin = null;
  });

  Future<void> _openFilters() async {
    final q = await Navigator.push<CarQuery>(
      context,
      MaterialPageRoute(
        builder: (_) => SearchScreen(initial: _query, returnQuery: true),
      ),
    );
    if (q != null) {
      _search.text = q.query;
      _setQuery(q);
    }
  }

  void _toggleFavorite(Car car) => setState(() {
    if (!_favorites.remove(car.id)) _favorites.add(car.id);
  });

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cars = _results;
    return Scaffold(
      backgroundColor: AppPalette.background,
      body: Column(
        children: [
          _header(),
          const Divider(height: 1, color: AppPalette.border),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
            child: Row(
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
                  height: 46,
                  onChanged: (i) => setState(() => _sort = i),
                ),
              ],
            ),
          ),
          Expanded(child: _map ? _mapView(cars) : _listView(cars)),
        ],
      ),
    );
  }

  Widget _header() {
    final parts = _query.parts;
    return Container(
      color: AppPalette.surface,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
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
                      style: displayStyle(28),
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
                controller: _search,
                fill: AppPalette.background,
                bordered: false,
                onSubmitted: (v) => _setQuery(_query.withText(v)),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SegmentedPicker(
                options: const ['☰  Жагсаалт', '⌖  Газрын зураг'],
                selected: _map ? 1 : 0,
                expand: true,
                height: 48,
                onChanged: (i) => setState(() => _map = i == 1),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  Material(
                    color: AppPalette.ink,
                    shape: const StadiumBorder(),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: _openFilters,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.tune_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              parts.isEmpty
                                  ? 'Шүүлтүүр'
                                  : 'Шүүлтүүр · ${parts.length}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  for (final p in parts)
                    Padding(
                      padding: const EdgeInsets.only(left: 10),
                      child: Material(
                        color: AppPalette.surface,
                        shape: const StadiumBorder(
                          side: BorderSide(
                            color: AppPalette.primary,
                            width: 1.5,
                          ),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => _setQuery(_query.without(p.key)),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              children: [
                                Text(
                                  p.label,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
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
            ),
            const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }

  Widget _listView(List<Car> cars) {
    if (cars.isEmpty) return _empty();
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
      children: [
        for (final car in cars)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: CarListCard(
              car: car,
              favorite: _favorites.contains(car.id),
              onFavorite: () => _toggleFavorite(car),
            ),
          ),
      ],
    );
  }

  Widget _empty() => const Center(
    child: Text(
      'Тохирох зар олдсонгүй',
      style: TextStyle(color: AppPalette.muted, fontSize: 16),
    ),
  );

  Widget _mapView(List<Car> cars) {
    final selected = _selectedPin != null && cars.contains(_selectedPin)
        ? _selectedPin
        : null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: Stack(
          children: [
            FlutterMap(
              options: MapOptions(
                initialCenter: ulaanbaatar,
                initialZoom: 12,
                onTap: (_, _) => setState(() => _selectedPin = null),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.mashinuud_app',
                ),
                MarkerLayer(
                  markers: [
                    for (final car in cars)
                      Marker(
                        point: car.position,
                        width: 96,
                        height: 40,
                        child: _PricePin(
                          label: car.shortPrice,
                          active: car == selected,
                          onTap: () => setState(() => _selectedPin = car),
                        ),
                      ),
                  ],
                ),
                const RichAttributionWidget(
                  attributions: [
                    TextSourceAttribution('OpenStreetMap contributors'),
                  ],
                ),
              ],
            ),
            if (selected != null)
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: CarListCard(
                  car: selected,
                  favorite: _favorites.contains(selected.id),
                  onFavorite: () => _toggleFavorite(selected),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PricePin extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _PricePin({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: active ? AppPalette.primary : AppPalette.ink,
            borderRadius: BorderRadius.circular(14),
            boxShadow: const [
              BoxShadow(
                color: Color(0x33000000),
                blurRadius: 8,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ),
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
                Text(
                  car.summary,
                  style: const TextStyle(color: AppPalette.muted),
                ),
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
