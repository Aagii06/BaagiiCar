import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/help.dart';
import 'package:mashinuud_app/screens/leasing.dart';
import 'package:mashinuud_app/screens/saved.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/app_bar.dart';
import 'package:mashinuud_app/widgets/car.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

const _mln = 1000000;
const _gutter = EdgeInsets.symmetric(horizontal: 16);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Bumped by pull-to-refresh so every section refetches.
  int _version = 0;
  List<BodyType> _bodyTypes = [];

  @override
  void initState() {
    super.initState();
    Api.getBodyTypes().then((b) => mounted ? setState(() => _bodyTypes = b) : null, onError: (_) {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const TabAppBar(),
      body: RefreshIndicator(
        color: AppPalette.primary,
        onRefresh: () async => setState(() => _version++),
        child: ListView(
          key: ValueKey(_version),
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            _Hero(bodyTypes: _bodyTypes),
            const SizedBox(height: 24),
            const Padding(padding: _gutter, child: _QuickLinks()),
            const SizedBox(height: 40),
            const _Featured(),
            const SizedBox(height: 40),
            const _BrandGrid(),
            const SizedBox(height: 40),
            _BodyTypes(items: _bodyTypes),
            const SizedBox(height: 40),
            const _Budgets(),
            const SizedBox(height: 40),
            const _Banner(),
          ],
        ),
      ),
    );
  }
}

// --- hero ---------------------------------------------------------------------

class _Slide {
  final String image;
  final Alignment focus;
  final String kicker, light, bold, text, cta;
  final void Function(BuildContext context, List<BodyType> bodyTypes) open;
  const _Slide(this.image, this.focus, this.kicker, this.light, this.bold, this.text, this.cta, this.open);
}

final _slides = [
  _Slide('suv-desert', const Alignment(0.36, 0.24), 'Жийп · SUV', 'Аянд гарах', 'жийпээ олоорой',
      'Land Cruiser, Prado, Lexus LX — Монголын замд тэсвэртэй машинууд нэг дор.', 'Жийп үзэх', (_, bodyTypes) {
    final id = bodyTypes.where((b) => b.name.toLowerCase() == 'жийп').firstOrNull?.id;
    Stores.shell.openCars(CarSearch(bodyTypeIds: id != null ? [id] : const []));
  }),
  _Slide('crossover-snow', const Alignment(0.44, 0.16), 'Өвөлд бэлэн', 'Хүйтэнд ч', 'найдвартай',
      '4WD хөтлөгчтэй кроссовер, жийпүүд — хальтиргаатай замд итгэлтэй.', 'Машин хайх', (_, _) => Stores.shell.openCars()),
  _Slide('electric-road', const Alignment(0.2, 0.24), 'Хэмнэлттэй', 'Хайбрид,', 'цахилгаан',
      'Шатахуунд бага зарцуулдаг Prius, Aqua болон цахилгаан машинууд.', 'Хайбрид үзэх',
      (_, _) => Stores.shell.openCars(const CarSearch(fuelTypes: ['Хайбрид', 'Цахилгаан']))),
  _Slide('coupe-forest', const Alignment(0.4, 0.24), 'Лизинг', 'Хуваан', 'төлөөрэй',
      'Сарын төлбөрөө тооцоолуураар урьдчилан бодоод, хүсэлтээ илгээгээрэй.', 'Тооцоолох',
      (context, _) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LeasingScreen()))),
];

/// Full-bleed photo carousel with the search card overlapping its bottom (web `HeroCarousel` + `HeroSearch`).
class _Hero extends StatefulWidget {
  final List<BodyType> bodyTypes;
  const _Hero({required this.bodyTypes});
  @override
  State<_Hero> createState() => _HeroState();
}

class _HeroState extends State<_Hero> {
  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _schedule();
  }

  void _schedule() {
    _timer?.cancel();
    _timer = Timer(const Duration(seconds: 6), () {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % _slides.length);
      _schedule();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = _slides[_index];
    // The search card overlaps the photo's bottom 48px.
    return Stack(clipBehavior: Clip.none, children: [
      SizedBox(
        height: 400,
        child: GestureDetector(
          onHorizontalDragEnd: (d) {
            final v = d.primaryVelocity ?? 0;
            if (v.abs() < 200) return;
            setState(() => _index = (_index + (v < 0 ? 1 : -1) + _slides.length) % _slides.length);
            _schedule();
          },
          child: Stack(fit: StackFit.expand, children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 700),
              // Cross-fading photos must each fill the hero box.
              layoutBuilder: (current, previous) => Stack(fit: StackFit.expand, children: [...previous, ?current]),
              child: Image.asset('assets/hero/${s.image}.webp', key: ValueKey(s.image), fit: BoxFit.cover, alignment: s.focus),
            ),
            // Bright wash, top-down, so the dark text reads on any photo.
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.white.withValues(alpha: 0.95), Colors.white.withValues(alpha: 0.75), Colors.white.withValues(alpha: 0.1)],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 36, 16, 0),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 500),
                transitionBuilder: (child, a) => FadeTransition(
                  opacity: a,
                  child: SlideTransition(position: Tween(begin: const Offset(0, 0.05), end: Offset.zero).animate(a), child: child),
                ),
                child: Column(
                  key: ValueKey(_index),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.kicker.toUpperCase(), style: kickerStyle(color: AppPalette.foreground.withValues(alpha: 0.7))),
                    const SizedBox(height: 12),
                    Text(s.light.toUpperCase(), style: displayStyle(44, weight: FontWeight.w300, height: 0.98)),
                    Text(s.bold.toUpperCase(), style: displayStyle(44, color: AppPalette.primary, height: 0.98)),
                    const SizedBox(height: 14),
                    Text(s.text, style: TextStyle(fontSize: 15, height: 1.6, color: AppPalette.foreground.withValues(alpha: 0.8))),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: () => s.open(context, widget.bodyTypes),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppPalette.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 1.1),
                      ),
                      child: Text(s.cta.toUpperCase()),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              right: 16,
              bottom: 64,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(99)),
                child: Row(
                  children: [
                    for (var i = 0; i < _slides.length; i++)
                      GestureDetector(
                        onTap: () {
                          setState(() => _index = i);
                          _schedule();
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          height: 6,
                          width: i == _index ? 32 : 16,
                          decoration: BoxDecoration(
                            color: i == _index ? AppPalette.primary : AppPalette.foreground.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ]),
        ),
      ),
      const Padding(padding: EdgeInsets.fromLTRB(16, 352, 16, 0), child: _HeroSearch()),
    ]);
  }
}

/// White search card: tabs, then make / model / year / price and "Хайх".
class _HeroSearch extends StatefulWidget {
  const _HeroSearch();
  @override
  State<_HeroSearch> createState() => _HeroSearchState();
}

class _HeroSearchState extends State<_HeroSearch> {
  static const _tabs = ['Бүх машин', 'Шинэвтэр', 'Хямд'];
  static const _years = [2020, 2015, 2010, 2005, 2000];
  static const _prices = [30, 60, 100, 200];
  int _tab = 0;
  int? _brand, _model, _yearFrom, _priceMax;
  List<Brand> _brands = [];
  List<CarModel> _models = [];
  bool _modelsLoading = false;

  @override
  void initState() {
    super.initState();
    Api.getBrands().then((b) => mounted ? setState(() => _brands = b) : null, onError: (_) {});
  }

  Future<void> _pickBrand(int? id) async {
    setState(() {
      _brand = id;
      _model = null;
      _models = [];
      _modelsLoading = id != null;
    });
    if (id == null) return;
    try {
      final m = await Api.getModels(id);
      if (mounted && _brand == id) setState(() => _models = m);
    } finally {
      if (mounted && _brand == id) setState(() => _modelsLoading = false);
    }
  }

  void _submit() {
    final year = DateTime.now().year;
    Stores.shell.openCars(CarSearch(
      brandIds: _brand != null ? [_brand!] : const [],
      modelId: _model,
      yearFrom: _yearFrom ?? (_tab == 1 ? year - 3 : null),
      priceMax: (_priceMax ?? (_tab == 2 ? 30 : null)) == null ? null : (_priceMax ?? 30) * _mln,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final year = DateTime.now().year;
    Widget divider() => const Divider(height: 1, indent: 16, endIndent: 16);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        for (var i = 0; i < _tabs.length; i++)
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: Material(
              color: i == _tab ? Colors.white : AppPalette.dark,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.md)),
              child: InkWell(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.md)),
                onTap: () => setState(() => _tab = i),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Text(
                    _tabs[i].toUpperCase(),
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.1, color: i == _tab ? AppPalette.foreground : Colors.white),
                  ),
                ),
              ),
            ),
          ),
      ]),
      Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(AppRadius.xl),
            bottomRight: Radius.circular(AppRadius.xl),
            topRight: Radius.circular(AppRadius.xl),
          ),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 40, offset: const Offset(0, 20))],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          SelectField<int>(
            labelled: true,
            label: 'Үйлдвэр',
            value: _brand,
            options: [for (final b in _brands) Option(b.id, b.name)],
            onChanged: _pickBrand,
          ),
          divider(),
          SelectField<int>(
            labelled: true,
            label: 'Загвар',
            value: _model,
            enabled: _brand != null,
            loading: _modelsLoading,
            options: [for (final m in _models) Option(m.id, m.name)],
            onChanged: (v) => setState(() => _model = v),
          ),
          divider(),
          SelectField<int>(
            labelled: true,
            label: 'Он',
            value: _yearFrom,
            options: [for (final y in _years) Option(y, '$y – $year')],
            onChanged: (v) => setState(() => _yearFrom = v),
          ),
          divider(),
          SelectField<int>(
            labelled: true,
            label: 'Үнэ',
            value: _priceMax,
            placeholder: 'Хязгааргүй',
            options: [for (final p in _prices) Option(p, '$p сая ₮ хүртэл')],
            onChanged: (v) => setState(() => _priceMax = v),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: SizedBox(
              height: 56,
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _submit,
                icon: const Icon(Icons.search_rounded),
                label: Text('ХАЙХ', style: displayStyle(18, weight: FontWeight.w600, color: Colors.white)),
                style: FilledButton.styleFrom(
                  backgroundColor: AppPalette.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
              ),
            ),
          ),
        ]),
      ),
    ]);
  }
}

// --- sections -----------------------------------------------------------------

class _QuickLinks extends StatelessWidget {
  const _QuickLinks();

  @override
  Widget build(BuildContext context) {
    void push(Widget page) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
    final items = [
      (Icons.search_rounded, AppPalette.tintBlue, const Color(0xFF2B7BD8), 'Машин хайх', () => Stores.shell.openCars()),
      (Icons.support_rounded, AppPalette.tintPeach, AppPalette.primary, 'Тусламж', () => push(const HelpScreen())),
      (Icons.credit_card_rounded, AppPalette.tintLavender, const Color(0xFF6B4FD8), 'Лизинг', () => push(const LeasingScreen())),
      (Icons.favorite_border_rounded, AppPalette.tintRose, AppPalette.destructive, 'Хадгалсан', () => push(const SavedScreen())),
    ];
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        for (final (icon, tint, color, title, onTap) in items)
          Material(
            color: AppPalette.card,
            borderRadius: BorderRadius.circular(AppRadius.xl),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(color: tint, borderRadius: BorderRadius.circular(AppRadius.md)),
                    child: Icon(icon, color: color, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text(title, maxLines: 2, style: displayStyle(16, weight: FontWeight.w600))),
                ]),
              ),
            ),
          ),
      ],
    );
  }
}

class _Featured extends StatelessWidget {
  const _Featured();
  @override
  Widget build(BuildContext context) => Padding(
        padding: _gutter,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SectionTitle(kicker: 'Онцлох', light: 'Онцлох', bold: 'машинууд', action: ViewAll(onTap: () => Stores.shell.openCars())),
          const SizedBox(height: 16),
          Loader<List<Car>>(
            fetch: () => Api.featuredCars(6),
            loading: const CarCardSkeleton(count: 3),
            builder: (context, cars, _) =>
                cars.isEmpty ? const EmptyView(title: 'Одоогоор зар алга') : CarList(cars: cars, featuredBadge: true),
          ),
        ]),
      );
}

class _BrandGrid extends StatelessWidget {
  const _BrandGrid();
  @override
  Widget build(BuildContext context) => Loader<List<Brand>>(
        fetch: Api.getBrands,
        loading: const SizedBox(height: 180),
        error: (_, _, _) => const SizedBox.shrink(),
        builder: (context, brands, _) {
          if (brands.isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: _gutter,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              SectionTitle(kicker: 'Бүх үйлдвэр', light: 'Машины', bold: 'үйлдвэр', action: ViewAll(onTap: () => Stores.shell.openCars())),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 4,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.25,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  for (final b in brands.take(8))
                    Material(
                      color: AppPalette.card,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () => Stores.shell.openCars(CarSearch(brandIds: [b.id])),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Tooltip(
                            message: b.name,
                            child: NetImage(
                              uploadUrl(b.logo, folder: 'brands'),
                              fit: BoxFit.contain,
                              background: AppPalette.card,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ]),
          );
        },
      );
}

class _BodyTypes extends StatelessWidget {
  final List<BodyType> items;
  const _BodyTypes({required this.items});
  static const _tints = [AppPalette.tintBlue, AppPalette.tintLavender, AppPalette.tintRose, AppPalette.tintMint, AppPalette.tintPeach];

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: _gutter,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SectionTitle(kicker: 'Төрөл', light: 'Төрлөөр', bold: 'хайх'),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.55,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            for (var i = 0; i < items.length; i++)
              _TintTile(
                color: _tints[i % _tints.length],
                title: items[i].name,
                subtitle: '${items[i].carCount} машин',
                image: uploadUrl(items[i].image, folder: 'bodyTypes'),
                onTap: () => Stores.shell.openCars(CarSearch(bodyTypeIds: [items[i].id])),
              ),
          ],
        ),
      ]),
    );
  }
}

class _Budgets extends StatelessWidget {
  const _Budgets();
  static const _bands = [
    (0, 30, AppPalette.tintBlue),
    (30, 60, AppPalette.tintLavender),
    (60, 100, AppPalette.tintRose),
    (100, 0, AppPalette.tintMint),
  ];

  static String _label(int min, int max) => min == 0 ? '$max сая хүртэл' : (max == 0 ? '$min сая +' : '$min – $max сая');

  @override
  Widget build(BuildContext context) => Padding(
        padding: _gutter,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SectionTitle(light: 'Төсвөөрөө', bold: 'сонго'),
          const SizedBox(height: 16),
          Loader<List<int>>(
            fetch: () => Future.wait([
              for (final (min, max, _) in _bands)
                Api.searchCars(CarSearch(priceMin: min > 0 ? min * _mln : null, priceMax: max > 0 ? max * _mln : null, pageSize: 1)).then((p) => p.count),
            ]),
            loading: const SizedBox(height: 200),
            error: (_, _, _) => const SizedBox.shrink(),
            builder: (context, counts, _) => GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.9,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                for (var i = 0; i < _bands.length; i++)
                  _TintTile(
                    color: _bands[i].$3,
                    title: _label(_bands[i].$1, _bands[i].$2),
                    subtitle: '${counts[i]} машин',
                    onTap: () => Stores.shell.openCars(CarSearch(
                      priceMin: _bands[i].$1 > 0 ? _bands[i].$1 * _mln : null,
                      priceMax: _bands[i].$2 > 0 ? _bands[i].$2 * _mln : null,
                    )),
                  ),
              ],
            ),
          ),
        ]),
      );
}

/// Pastel tile: title + count, optional picture on the right (body types, budgets).
class _TintTile extends StatelessWidget {
  final Color color;
  final String title;
  final String subtitle;
  final String? image;
  final VoidCallback onTap;
  const _TintTile({required this.color, required this.title, required this.subtitle, required this.onTap, this.image});

  @override
  Widget build(BuildContext context) => Material(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: displayStyle(19, weight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(subtitle, style: TextStyle(fontSize: 13, color: AppPalette.foreground.withValues(alpha: 0.6))),
              if (image != null) ...[
                const Spacer(),
                Align(alignment: Alignment.bottomRight, child: SizedBox(height: 36, width: 72, child: NetImage(image, fit: BoxFit.contain, background: color))),
              ],
            ]),
          ),
        ),
      );
}

/// "Мөрөөдөх биш, жолоод" banner with the three steps.
class _Banner extends StatelessWidget {
  const _Banner();
  static const _steps = [
    ('01', 'Хайх', 'Үйлдвэр, загвар, он, үнээр шүүнэ.'),
    ('02', 'Харьцуулах', 'Зураг, үзүүлэлтийг нь сайтар үзнэ.'),
    ('03', 'Холбогдох', 'Зарлагч руу шууд залгаж тохирно.'),
  ];

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [Color(0xFFEEF3F8), Color(0xFFF8FAFC), Color(0xFFE6EEF6)], stops: [0, 0.55, 1]),
        ),
        padding: const EdgeInsets.fromLTRB(16, 40, 16, 40),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('МАШИН АВАХ', style: kickerStyle()),
          const SizedBox(height: 12),
          Text('МӨРӨӨДӨХ БИШ,', style: displayStyle(44, weight: FontWeight.w300, height: 0.98)),
          Text('ЖОЛООД', style: displayStyle(44, color: AppPalette.primary, height: 0.98)),
          const SizedBox(height: 18),
          Text('Зарыг шүүж, тохирохоо сонгоод зарлагчтай шууд холбогдоорой.',
              style: TextStyle(fontSize: 15, height: 1.7, color: AppPalette.foreground.withValues(alpha: 0.7))),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => Stores.shell.openCars(),
            iconAlignment: IconAlignment.end,
            icon: const Icon(Icons.arrow_forward_rounded, size: 18),
            label: const Text('МАШИН ХАЙХ'),
            style: FilledButton.styleFrom(
              backgroundColor: AppPalette.dark,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
              textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 1.1),
            ),
          ),
          const SizedBox(height: 32),
          for (final (n, title, text) in _steps)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.xl),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 24, offset: const Offset(0, 10))],
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(n, style: displayStyle(36, color: AppPalette.primary)),
                const SizedBox(height: 14),
                Text(title.toUpperCase(), style: displayStyle(18, weight: FontWeight.w600)),
                const SizedBox(height: 6),
                Text(text, style: const TextStyle(fontSize: 13, height: 1.5, color: AppPalette.mutedForeground)),
              ]),
            ),
        ]),
      );
}
