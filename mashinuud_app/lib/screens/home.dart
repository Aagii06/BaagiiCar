import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/screens/detail.dart';
import 'package:mashinuud_app/screens/list.dart';
import 'package:mashinuud_app/screens/post_ad.dart';
import 'package:mashinuud_app/screens/search.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

const List<String> homeCategories = ['Бүгд', 'Седан', 'Жийп', 'Хэтчбэк', 'Пикап'];
const List<String> homeBrands = ['Toyota', 'Lexus', 'Hyundai', 'Nissan'];

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _category = 0;

  void _openList({String? title, String? query, String? brand, String? body}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ListScreen(
          title: title,
          searchQuery: query,
          brand: brand,
          bodyType: body,
        ),
      ),
    );
  }

  void _openCar(Car car) => Navigator.push(
    context,
    MaterialPageRoute(builder: (_) => DetailScreen(carId: car.id)),
  );

  @override
  Widget build(BuildContext context) {
    final featured = carData.where((c) => c.badge != null).toList();
    final newest = carData.reversed.take(4).toList();

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.only(top: 24, bottom: 32),
          children: [
            _pad(_greeting()),
            const SizedBox(height: 28),
            _pad(Text('Мөрөөдлийн\nмашинаа\nолоорой', style: displayStyle(44))),
            const SizedBox(height: 28),
            _pad(_searchRow()),
            const SizedBox(height: 24),
            _categories(),
            const SizedBox(height: 24),
            _pad(_promoCard()),
            const SizedBox(height: 32),
            _pad(const SectionHeader(title: 'Брэндүүд')),
            const SizedBox(height: 16),
            _pad(_brands()),
            const SizedBox(height: 32),
            _pad(
              SectionHeader(
                title: 'Онцлох зарууд',
                action: 'Бүгдийг харах',
                onAction: () => _openList(title: 'Онцлох зарууд'),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 330,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: featured.length,
                separatorBuilder: (_, _) => const SizedBox(width: 16),
                itemBuilder: (_, i) => _FeaturedCard(
                  car: featured[i],
                  onTap: () => _openCar(featured[i]),
                ),
              ),
            ),
            const SizedBox(height: 32),
            _pad(const SectionHeader(title: 'Шинээр нэмэгдсэн')),
            const SizedBox(height: 16),
            for (final car in newest)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: _CompactCarCard(car: car, onTap: () => _openCar(car)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _pad(Widget child) =>
      Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: child);

  Widget _greeting() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Сайн байна уу',
                style: TextStyle(color: AppPalette.muted, fontSize: 16),
              ),
              SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.location_on_outlined, size: 20),
                  SizedBox(width: 6),
                  Text(
                    'Улаанбаатар',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ],
          ),
        ),
        SquareIconButton(
          icon: Icons.notifications_none_rounded,
          size: 56,
          dot: true,
          onTap: () {},
        ),
      ],
    );
  }

  Widget _searchRow() {
    return Row(
      children: [
        Expanded(
          child: SearchField(
            hint: 'Марк, загвар, он...',
            onSubmitted: (q) => _openList(title: 'Хайлт', query: q),
          ),
        ),
        const SizedBox(width: 12),
        SquareIconButton(
          icon: Icons.tune_rounded,
          size: 60,
          bordered: false,
          background: AppPalette.primary,
          iconColor: Colors.white,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const SearchScreen()),
          ),
        ),
      ],
    );
  }

  Widget _categories() {
    return SizedBox(
      height: 50,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: homeCategories.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) => PillChip(
          label: homeCategories[i],
          selected: i == _category,
          onTap: () {
            setState(() => _category = i);
            if (i > 0) {
              _openList(title: homeCategories[i], body: homeCategories[i]);
            }
          },
        ),
      ),
    );
  }

  Widget _promoCard() {
    return Container(
      padding: const EdgeInsets.fromLTRB(28, 28, 20, 28),
      decoration: BoxDecoration(
        color: AppPalette.ink,
        borderRadius: BorderRadius.circular(32),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ЗАР ОРУУЛАХ',
                  style: TextStyle(
                    color: AppPalette.accent,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Машинаа 5 минутад зараарай',
                  style: displayStyle(26, color: Colors.white),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      fullscreenDialog: true,
                      builder: (_) => const PostAdScreen(),
                    ),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppPalette.ink,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 26,
                      vertical: 18,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  child: const Text('Зар нэмэх'),
                ),
              ],
            ),
          ),
          const Expanded(
            flex: 2,
            child: FittedBox(
              child: CarOutline(width: 110, color: AppPalette.accent),
            ),
          ),
        ],
      ),
    );
  }

  Widget _brands() {
    return Row(
      children: [
        for (var i = 0; i < homeBrands.length; i++) ...[
          if (i > 0) const SizedBox(width: 12),
          Expanded(
            child: Material(
              color: AppPalette.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(22),
                side: const BorderSide(color: AppPalette.border),
              ),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () =>
                    _openList(title: homeBrands[i], brand: homeBrands[i]),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: AppPalette.primaryTint,
                        child: Text(
                          homeBrands[i][0],
                          style: const TextStyle(
                            color: AppPalette.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        homeBrands[i],
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  final Car car;
  final VoidCallback onTap;

  const _FeaturedCard({required this.car, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 300,
      child: AppCard(
        padding: EdgeInsets.zero,
        radius: 28,
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                CarThumb(
                  tint: car.tint,
                  height: 185,
                  carWidth: 180,
                  radius: BorderRadius.zero,
                ),
                Positioned(
                  top: 14,
                  left: 14,
                  child: Tag(label: car.badge!),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    car.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    car.summary,
                    style: const TextStyle(color: AppPalette.muted),
                  ),
                  const SizedBox(height: 8),
                  PriceText(car.priceLabel, size: 21),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CompactCarCard extends StatelessWidget {
  final Car car;
  final VoidCallback onTap;

  const _CompactCarCard({required this.car, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      radius: 26,
      onTap: onTap,
      child: Row(
        children: [
          CarThumb(tint: car.tint, width: 130, height: 104, carWidth: 92),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  car.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(car.summary, style: const TextStyle(color: AppPalette.muted)),
                const SizedBox(height: 6),
                PriceText(car.priceLabel),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
