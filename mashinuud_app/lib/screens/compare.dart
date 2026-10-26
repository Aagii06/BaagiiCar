import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/app_bar.dart';
import 'package:mashinuud_app/widgets/car.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

/// Which end of a numeric row is better; the best cell is green, the worst red.
enum _Best { min, max }

class _Row {
  final String label;
  final String? Function(Car) value;
  final double? Function(Car)? num;
  final _Best? best;
  const _Row(this.label, this.value, {this.num, this.best});
}

final _rows = <_Row>[
  _Row('Үнэ', (c) => formatPrice(c.price), num: (c) => toNumber(c.price) == 0 ? null : toNumber(c.price), best: _Best.min),
  _Row('Үйлдвэрлэсэн он', (c) => c.manufacturedYear?.toString(), num: (c) => c.manufacturedYear?.toDouble(), best: _Best.max),
  _Row('Орж ирсэн он', (c) => c.importedYear?.toString(), num: (c) => c.importedYear?.toDouble(), best: _Best.max),
  _Row('Гүйлт', (c) => c.mileage != null ? formatKm(c.mileage) : null, num: (c) => c.mileage?.toDouble(), best: _Best.min),
  _Row('Хөдөлгүүр', (c) => toNumber(c.engineCapacity) != 0 ? formatEngine(c.engineCapacity) : null),
  _Row('Түлш', (c) => c.fuelType),
  _Row('Хурдны хайрцаг', (c) => c.transmission),
  _Row('Хүрд', (c) => c.steering),
  _Row('Хөтлөгч', (c) => c.driveType),
  _Row('Төрөл', (c) => c.bodyTypeName),
  _Row('Ангилал', (c) => c.vehicleType),
  _Row('Гадна өнгө', (c) => c.color),
  _Row('Дотор өнгө', (c) => c.interiorColor),
  _Row('Байршил', (c) => c.locationName),
];

({Set<int> best, Set<int> worst}) _rank(List<Car> cars, _Row row) {
  const none = (best: <int>{}, worst: <int>{});
  if (row.best == null || row.num == null || cars.length < 2) return none;
  final nums = cars.map(row.num!).toList();
  final valid = nums.whereType<double>().where((n) => n > 0).toList();
  if (valid.length < 2) return none;
  final lo = valid.reduce((a, b) => a < b ? a : b);
  final hi = valid.reduce((a, b) => a > b ? a : b);
  // Everyone equal — nothing stands out.
  if (lo == hi) return none;
  final good = row.best == _Best.min ? lo : hi;
  final bad = row.best == _Best.min ? hi : lo;
  Set<int> at(double v) => {
    for (var i = 0; i < nums.length; i++)
      if (nums[i] == v) i,
  };
  return (best: at(good), worst: at(bad));
}

/// "Харьцуулалт" tab: up to four cars side by side.
class CompareScreen extends StatefulWidget {
  const CompareScreen({super.key});
  @override
  State<CompareScreen> createState() => _CompareScreenState();
}

class _CompareScreenState extends State<CompareScreen> {
  final Map<int, Car> _cars = {};
  bool _loading = false;
  Object? _error;
  bool _diffOnly = false;

  @override
  void initState() {
    super.initState();
    Stores.compare.addListener(_sync);
    _sync();
  }

  @override
  void dispose() {
    Stores.compare.removeListener(_sync);
    super.dispose();
  }

  /// Fetch the picked cars not loaded yet.
  Future<void> _sync() async {
    final missing = Stores.compare.ids.where((id) => !_cars.containsKey(id)).toList();
    setState(() {});
    if (missing.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      for (final c in await Api.getCarsByIds(missing)) {
        _cars[c.id] = c;
      }
    } catch (e) {
      _error = e;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ids = Stores.compare.ids;
    final cars = [for (final id in ids) ?_cars[id]];
    final diff = _diffOnly && cars.length > 1;
    final visible = diff ? _rows.where((r) => cars.map((c) => r.value(c) ?? '').toSet().length > 1).toList() : _rows;
    final slot = cars.length < AppConstants.compareMax;
    const labelW = 112.0, colW = 168.0;

    Widget cell(Widget child, {double width = colW}) => SizedBox(
      width: width,
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 6), child: child),
    );

    return Scaffold(
      appBar: const TabAppBar(title: 'Харьцуулалт'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
        children: [
          if (cars.length > 1) ...[
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _diffOnly = !_diffOnly),
                    child: Row(
                      children: [
                        SizedBox.square(
                          dimension: 22,
                          child: Checkbox(value: _diffOnly, activeColor: AppPalette.primary, onChanged: (v) => setState(() => _diffOnly = v ?? false)),
                        ),
                        const SizedBox(width: 8),
                        const Flexible(
                          child: Text('Зөвхөн ялгааг харуулах', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ),
                ),
                ActionChip(
                  onPressed: () {
                    // Back to the screen as on first visit.
                    Stores.compare.clear();
                    setState(() => _diffOnly = false);
                  },
                  avatar: const Icon(Icons.close_rounded, size: 15),
                  label: const Text('Цэвэрлэх'),
                  labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground),
                  backgroundColor: AppPalette.muted,
                  side: BorderSide.none,
                  shape: const StadiumBorder(),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          if (cars.isEmpty)
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: Text(
                'Машины карт дээрх харьцуулах товчийг дарж 4 хүртэл машин нэмнэ үү.',
                style: TextStyle(fontSize: 13, color: AppPalette.mutedForeground),
              ),
            ),
          if (_error != null) ErrorView(message: '$_error', onRetry: _sync),
          if (_loading && cars.length < ids.length) const LoadingView(padding: 24),
          Panel(
            padding: EdgeInsets.zero,
            child: LayoutBuilder(
              builder: (context, box) => SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                // At least the card's width, so the striped rows run edge to edge.
                child: SizedBox(
                  width: [box.maxWidth, labelW + (cars.length + (slot ? 1 : 0)) * colW + 24].reduce((a, b) => a > b ? a : b),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(width: labelW),
                            for (final c in cars)
                              cell(
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Stack(
                                      children: [
                                        GestureDetector(
                                          onTap: () => openCar(context, c),
                                          child: AspectRatio(aspectRatio: 4 / 3, child: CarImage(c)),
                                        ),
                                        Positioned(
                                          right: 6,
                                          top: 6,
                                          child: Material(
                                            color: Colors.white,
                                            shape: const CircleBorder(),
                                            elevation: 1,
                                            child: InkWell(
                                              customBorder: const CircleBorder(),
                                              onTap: () => Stores.compare.remove(c.id),
                                              child: const SizedBox.square(dimension: 30, child: Icon(Icons.close_rounded, size: 16)),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    GestureDetector(
                                      onTap: () => openCar(context, c),
                                      child: Text.rich(
                                        TextSpan(
                                          children: [
                                            TextSpan(text: c.title),
                                            if (c.manufacturedYear != null)
                                              TextSpan(
                                                text: ' · ${c.manufacturedYear}',
                                                style: const TextStyle(fontWeight: FontWeight.w500, color: AppPalette.mutedForeground),
                                              ),
                                          ],
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontWeight: FontWeight.w700, height: 1.3),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(formatPrice(c.price), style: displayStyle(17, color: AppPalette.primary)),
                                  ],
                                ),
                              ),
                            if (slot)
                              cell(
                                AspectRatio(
                                  aspectRatio: 4 / 3,
                                  child: Material(
                                    color: Colors.transparent,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(AppRadius.md),
                                      side: const BorderSide(color: AppPalette.input, width: 2),
                                    ),
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(AppRadius.md),
                                      onTap: () => showComparePicker(context),
                                      child: const Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.add_rounded, size: 28, color: AppPalette.mutedForeground),
                                          SizedBox(height: 6),
                                          Text(
                                            'Машин нэмэх',
                                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      for (var ri = 0; ri < visible.length; ri++)
                        Builder(
                          builder: (context) {
                            final r = visible[ri];
                            final rank = _rank(cars, r);
                            return Container(
                              color: ri.isEven ? AppPalette.muted.withValues(alpha: 0.6) : null,
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 12),
                              child: Row(
                                children: [
                                  cell(
                                    Text(
                                      r.label,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppPalette.mutedForeground),
                                    ),
                                    width: labelW,
                                  ),
                                  for (var i = 0; i < cars.length; i++)
                                    cell(
                                      Builder(
                                        builder: (_) {
                                          final v = r.value(cars[i]);
                                          final color = rank.best.contains(i)
                                              ? AppPalette.success
                                              : rank.worst.contains(i)
                                              ? AppPalette.destructive
                                              : AppPalette.foreground;
                                          if (v == null || v.isEmpty) return const Text('—', style: TextStyle(color: AppPalette.mutedForeground));
                                          return Row(
                                            children: [
                                              Flexible(
                                                child: Text(
                                                  v,
                                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: color),
                                                ),
                                              ),
                                              if (rank.best.contains(i)) ...[
                                                const SizedBox(width: 4),
                                                Icon(Icons.emoji_events_outlined, size: 14, color: color),
                                              ],
                                            ],
                                          );
                                        },
                                      ),
                                    ),
                                  if (slot) cell(const SizedBox()),
                                ],
                              ),
                            );
                          },
                        ),
                      if (diff && visible.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 32),
                          child: Text('Ялгаатай үзүүлэлт алга', style: TextStyle(color: AppPalette.mutedForeground)),
                        ),
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

// --- picker -------------------------------------------------------------------

Future<void> showComparePicker(BuildContext context) => showModalBottomSheet(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  backgroundColor: Colors.white,
  builder: (context) => Padding(
    padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
    child: const FractionallySizedBox(heightFactor: 0.88, child: _ComparePicker()),
  ),
);

class _ComparePicker extends StatefulWidget {
  const _ComparePicker();
  @override
  State<_ComparePicker> createState() => _ComparePickerState();
}

class _ComparePickerState extends State<_ComparePicker> {
  static const _page = 20;
  static const _mln = 1000000;
  static const _bands = [(0, 30), (30, 60), (60, 100), (100, 0)];

  final _query = TextEditingController();
  Timer? _debounce;
  String _text = '';
  int _take = _page;
  int? _brand, _model, _dealer, _band;
  List<Brand> _brands = [];
  List<CarModel> _models = [];
  List<Dealer> _dealers = [];

  @override
  void initState() {
    super.initState();
    Stores.compare.addListener(_onCompare);
    Api.getBrands().then((b) => mounted ? setState(() => _brands = b) : null, onError: (_) {});
    Api.getDealers().then((d) => mounted ? setState(() => _dealers = d) : null, onError: (_) {});
  }

  @override
  void dispose() {
    Stores.compare.removeListener(_onCompare);
    _debounce?.cancel();
    _query.dispose();
    super.dispose();
  }

  /// Closes itself once the list is full.
  void _onCompare() {
    if (Stores.compare.full && mounted) Navigator.pop(context);
  }

  void _filter(VoidCallback change) => setState(() {
    change();
    _take = _page;
  });

  String _bandLabel(int i) {
    final (min, max) = _bands[i];
    return min == 0 ? '$max сая хүртэл' : (max == 0 ? '$min сая +' : '$min – $max сая');
  }

  @override
  Widget build(BuildContext context) {
    final band = _band == null ? null : _bands[_band!];
    final search = CarSearch(
      text: _text,
      brandIds: _brand != null ? [_brand!] : const [],
      modelId: _model,
      dealerId: _dealer,
      priceMin: band != null && band.$1 > 0 ? band.$1 * _mln : null,
      priceMax: band != null && band.$2 > 0 ? band.$2 * _mln : null,
      featuredFirst: true,
      pageSize: _take,
    );
    final filtered = _brand != null || _model != null || _dealer != null || _band != null;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 8, 0),
          child: Row(
            children: [
              const Text('Машин нэмэх', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(width: 10),
              ListenableBuilder(
                listenable: Stores.compare,
                builder: (_, _) => Text('${Stores.compare.ids.length} / ${AppConstants.compareMax}', style: const TextStyle(color: AppPalette.mutedForeground)),
              ),
              const Spacer(),
              IconButton(tooltip: 'Хаах', onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded)),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: Column(
            children: [
              TextField(
                controller: _query,
                decoration: const InputDecoration(hintText: 'Үйлдвэр, загвараар хайх', prefixIcon: Icon(Icons.search_rounded, size: 20)),
                onChanged: (v) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 300), () => _filter(() => _text = v.trim()));
                },
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: SelectField<int>(
                      label: 'Үйлдвэр',
                      placeholder: 'Бүх үйлдвэр',
                      value: _brand,
                      options: [for (final b in _brands) Option(b.id, b.name)],
                      onChanged: (v) {
                        _filter(() {
                          _brand = v;
                          _model = null;
                          _models = [];
                        });
                        if (v != null) Api.getModels(v).then((m) => mounted && _brand == v ? setState(() => _models = m) : null, onError: (_) {});
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: SelectField<int>(
                      label: 'Загвар',
                      placeholder: 'Бүх загвар',
                      value: _model,
                      enabled: _brand != null,
                      options: [for (final m in _models) Option(m.id, m.name)],
                      onChanged: (v) => _filter(() => _model = v),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: SelectField<int>(
                      label: 'Дилер',
                      placeholder: 'Бүх дилер',
                      value: _dealer,
                      options: [for (final d in _dealers) Option(d.id, d.name)],
                      onChanged: (v) => _filter(() => _dealer = v),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: SelectField<int>(
                      label: 'Үнэ',
                      placeholder: 'Бүх үнэ',
                      value: _band,
                      options: [for (var i = 0; i < _bands.length; i++) Option(i, _bandLabel(i))],
                      onChanged: (v) => _filter(() => _band = v),
                    ),
                  ),
                ],
              ),
              if (filtered)
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () => _filter(() {
                      _brand = _model = _dealer = _band = null;
                      _models = [];
                    }),
                    style: TextButton.styleFrom(foregroundColor: AppPalette.mutedForeground, padding: EdgeInsets.zero, minimumSize: const Size(0, 32)),
                    child: const Text('Цэвэрлэх', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: Loader<ListPage<Car>>(
            fetchKey: '$_text|$_brand|$_model|$_dealer|$_band|$_take',
            fetch: () => Api.searchCars(search),
            builder: (context, page, refreshing) {
              if (page.rows.isEmpty) {
                return const Center(
                  child: Text('Тохирох зар олдсонгүй', style: TextStyle(color: AppPalette.mutedForeground)),
                );
              }
              final more = page.count > page.rows.length;
              return ListenableBuilder(
                listenable: Stores.compare,
                builder: (context, _) => ListView.builder(
                  padding: const EdgeInsets.fromLTRB(8, 8, 8, 16),
                  itemCount: page.rows.length + (more ? 1 : 0),
                  itemBuilder: (context, i) {
                    if (i == page.rows.length) {
                      return Padding(
                        padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                        child: SizedBox(
                          height: 42,
                          child: FilledButton(
                            onPressed: refreshing ? null : () => setState(() => _take += _page),
                            style: FilledButton.styleFrom(
                              backgroundColor: AppPalette.muted,
                              disabledBackgroundColor: AppPalette.muted,
                              foregroundColor: AppPalette.foreground,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                            ),
                            child: refreshing
                                ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: AppPalette.primary))
                                : const Text('Цааш үзэх', style: TextStyle(fontWeight: FontWeight.w700)),
                          ),
                        ),
                      );
                    }
                    final c = page.rows[i];
                    final added = Stores.compare.has(c.id);
                    return InkWell(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      // Tapping a checked car removes it again.
                      onTap: () => Stores.compare.toggle(c.id),
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 80,
                              height: 56,
                              child: CarImage(c, size: 'thumb', radius: AppRadius.sm),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text.rich(
                                    TextSpan(
                                      children: [
                                        TextSpan(text: c.title),
                                        if (c.manufacturedYear != null)
                                          TextSpan(
                                            text: ' · ${c.manufacturedYear}',
                                            style: const TextStyle(fontWeight: FontWeight.w400, color: AppPalette.mutedForeground),
                                          ),
                                      ],
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(height: 2),
                                  Text.rich(
                                    TextSpan(
                                      style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground),
                                      children: [
                                        if (c.isFeatured)
                                          const WidgetSpan(
                                            alignment: PlaceholderAlignment.middle,
                                            child: Padding(
                                              padding: EdgeInsets.only(right: 6),
                                              child: Pill('Онцлох', background: AppPalette.successSoft, color: AppPalette.success),
                                            ),
                                          ),
                                        TextSpan(
                                          text: formatPriceShort(c.price),
                                          style: const TextStyle(fontWeight: FontWeight.w700, color: AppPalette.primary),
                                        ),
                                        if (c.mileage != null) TextSpan(text: ' · ${formatKm(c.mileage)}'),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: added ? AppPalette.successSoft : null,
                                border: added ? null : Border.all(color: AppPalette.primary, width: 1.5),
                              ),
                              child: Icon(added ? Icons.check_rounded : Icons.add_rounded, size: 18, color: added ? AppPalette.success : AppPalette.primary),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
