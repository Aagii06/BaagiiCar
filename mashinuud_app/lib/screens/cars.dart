import 'package:flutter/material.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/app_bar.dart';
import 'package:mashinuud_app/widgets/car.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

const _mln = 1000000;

CarSearch _copy(
  CarSearch s, {
  Object? dealerId = _keep,
  List<int>? brandIds,
  Object? modelId = _keep,
  List<int>? bodyTypeIds,
  Object? yearFrom = _keep,
  Object? yearTo = _keep,
  Object? importedFrom = _keep,
  Object? importedTo = _keep,
  Object? priceMin = _keep,
  Object? priceMax = _keep,
  List<String>? fuelTypes,
  Object? steering = _keep,
  CarSort? sort,
}) =>
    CarSearch(
      brandIds: brandIds ?? s.brandIds,
      modelId: modelId == _keep ? s.modelId : modelId as int?,
      bodyTypeIds: bodyTypeIds ?? s.bodyTypeIds,
      locationId: s.locationId,
      dealerId: dealerId == _keep ? s.dealerId : dealerId as int?,
      yearFrom: yearFrom == _keep ? s.yearFrom : yearFrom as int?,
      yearTo: yearTo == _keep ? s.yearTo : yearTo as int?,
      importedFrom: importedFrom == _keep ? s.importedFrom : importedFrom as int?,
      importedTo: importedTo == _keep ? s.importedTo : importedTo as int?,
      priceMin: priceMin == _keep ? s.priceMin : priceMin as int?,
      priceMax: priceMax == _keep ? s.priceMax : priceMax as int?,
      fuelTypes: fuelTypes ?? s.fuelTypes,
      steering: steering == _keep ? s.steering : steering as String?,
      sort: sort ?? s.sort,
      featuredFirst: true,
    );

const _keep = Object();

/// "Хайх" tab — the website's /cars on a phone.
class CarsScreen extends StatefulWidget {
  const CarsScreen({super.key});
  @override
  State<CarsScreen> createState() => _CarsScreenState();
}

class _CarsScreenState extends State<CarsScreen> {
  CarSearch _search = const CarSearch(featuredFirst: true);
  int _pages = 1;
  ListPage<Car>? _result;
  Object? _error;
  bool _loading = true;
  bool _loadingMore = false;
  int _request = 0;

  List<Brand>? _brands;
  List<Dealer>? _dealers;
  List<BodyType> _bodyTypes = [];

  @override
  void initState() {
    super.initState();
    Stores.shell.addListener(_takePending);
    _takePending(load: false);
    _load();
    Api.getBrands().then((b) => mounted ? setState(() => _brands = b) : null, onError: (_) => mounted ? setState(() => _brands = []) : null);
    Api.getDealers().then((d) => mounted ? setState(() => _dealers = d) : null, onError: (_) => mounted ? setState(() => _dealers = []) : null);
    Api.getBodyTypes().then((b) => mounted ? setState(() => _bodyTypes = b) : null, onError: (_) {});
  }

  @override
  void dispose() {
    Stores.shell.removeListener(_takePending);
    super.dispose();
  }

  /// Filters handed over from the home screen.
  void _takePending({bool load = true}) {
    final next = Stores.shell.pendingSearch;
    if (next == null) return;
    Stores.shell.pendingSearch = null;
    _search = _copy(next);
    if (load) _apply(_search);
  }

  void _apply(CarSearch s) {
    setState(() {
      _search = s;
      _pages = 1;
    });
    _load();
  }

  Future<void> _load({bool more = false}) async {
    final id = ++_request;
    setState(() {
      _loading = true;
      _loadingMore = more;
      _error = null;
    });
    try {
      // "Цааш үзэх" refetches every batch shown so far in one go (same as the website).
      final s = _search;
      final res = await Api.searchCars(CarSearch(
        brandIds: s.brandIds,
        modelId: s.modelId,
        bodyTypeIds: s.bodyTypeIds,
        locationId: s.locationId,
        dealerId: s.dealerId,
        yearFrom: s.yearFrom,
        yearTo: s.yearTo,
        importedFrom: s.importedFrom,
        importedTo: s.importedTo,
        priceMin: s.priceMin,
        priceMax: s.priceMax,
        fuelTypes: s.fuelTypes,
        steering: s.steering,
        sort: s.sort,
        featuredFirst: true,
        pageSize: AppConstants.pageSize * _pages,
      ));
      if (!mounted || id != _request) return;
      setState(() => _result = res);
    } catch (e) {
      if (!mounted || id != _request) return;
      setState(() => _error = e);
    } finally {
      if (mounted && id == _request) {
        setState(() {
          _loading = false;
          _loadingMore = false;
        });
      }
    }
  }

  int get _filterCount {
    final s = _search;
    return [
      s.dealerId != null,
      s.brandIds.isNotEmpty,
      s.modelId != null,
      s.bodyTypeIds.isNotEmpty,
      s.yearFrom != null || s.yearTo != null,
      s.importedFrom != null || s.importedTo != null,
      s.priceMin != null || s.priceMax != null,
      s.fuelTypes.isNotEmpty,
      s.steering != null,
    ].where((x) => x).length;
  }

  Future<void> _openFilters() async {
    final next = await Navigator.of(context).push<CarSearch>(
      MaterialPageRoute(fullscreenDialog: true, builder: (_) => FiltersScreen(initial: _search, dealers: _dealers ?? [], brands: _brands ?? [], bodyTypes: _bodyTypes)),
    );
    if (next != null) _apply(next);
  }

  @override
  Widget build(BuildContext context) {
    final rows = _result?.rows ?? [];
    final wide = rows.where((c) => c.isFeatured).firstOrNull;
    final rest = rows.where((c) => c != wide).toList();
    final more = (_result?.count ?? 0) > rows.length;

    return Scaffold(
      appBar: const TabAppBar(title: 'Машин хайх'),
      body: RefreshIndicator(
        color: AppPalette.primary,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
          children: [
            if (_dealers == null || _dealers!.isNotEmpty) ...[
              const _RowLabel('Дилерүүд'),
              _TileRow(
                loading: _dealers == null,
                children: [
                  for (final d in _dealers ?? <Dealer>[])
                    _LogoTile(
                      label: d.name,
                      image: uploadUrl(d.logo, folder: 'dealers'),
                      // Picks the dealer filter (tap again to clear), like the brand row.
                      selected: _search.dealerId == d.id,
                      onTap: () => _apply(_copy(_search, dealerId: _search.dealerId == d.id ? null : d.id)),
                    ),
                ],
              ),
              const SizedBox(height: 14),
            ],
            const _RowLabel('Үйлдвэр'),
            _TileRow(
              loading: _brands == null,
              children: [
                for (final b in _brands ?? <Brand>[])
                  _LogoTile(
                    label: b.name,
                    image: uploadUrl(b.logo, folder: 'brands'),
                    selected: _search.brandIds.length == 1 && _search.brandIds.first == b.id,
                    onTap: () {
                      final on = _search.brandIds.length == 1 && _search.brandIds.first == b.id;
                      _apply(_copy(_search, brandIds: on ? const [] : [b.id], modelId: null));
                    },
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: Material(
                  color: AppPalette.card,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    onTap: _openFilters,
                    child: SizedBox(
                      height: 44,
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.tune_rounded, size: 18),
                        const SizedBox(width: 8),
                        const Text('Шүүлтүүр', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                        if (_filterCount > 0) ...[
                          const SizedBox(width: 6),
                          CircleAvatar(
                            radius: 10,
                            backgroundColor: AppPalette.primary,
                            child: Text('$_filterCount', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                          ),
                        ],
                      ]),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 170,
                child: SelectField<CarSort>(
                  label: 'Эрэмбэлэх',
                  value: _search.sort,
                  placeholder: CarSort.newest.label,
                  options: [for (final s in CarSort.values.skip(1)) Option(s, s.label)],
                  onChanged: (v) => _apply(_copy(_search, sort: v ?? CarSort.newest)),
                ),
              ),
            ]),
            const SizedBox(height: 14),
            Text(_result != null ? '${_result!.count} зар олдлоо' : ' ', style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
            const SizedBox(height: 10),
            if (_error != null)
              ErrorView(message: '$_error', onRetry: _load)
            else if (_result == null)
              const CarCardSkeleton()
            else if (rows.isEmpty)
              const EmptyView(title: 'Тохирох зар олдсонгүй', description: 'Шүүлтүүрээ өөрчлөөд дахин оролдоно уу.')
            else
              AnimatedOpacity(
                duration: const Duration(milliseconds: 150),
                // Only a filter change dims the list; loading more keeps it as is.
                opacity: _loading && !_loadingMore ? 0.55 : 1,
                child: Column(children: [
                  CarList(cars: rest.take(3).toList()),
                  if (wide != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: CarWideCard(car: wide)),
                  CarList(cars: rest.skip(3).toList()),
                ]),
              ),
            if (more && _error == null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Material(
                  color: AppPalette.card,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    onTap: _loading
                        ? null
                        : () {
                            _pages++;
                            _load(more: true);
                          },
                    child: SizedBox(
                      height: 46,
                      child: Center(
                        child: _loadingMore
                            ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: AppPalette.primary))
                            : Text.rich(TextSpan(children: [
                                const TextSpan(text: 'Цааш үзэх  ', style: TextStyle(fontWeight: FontWeight.w700)),
                                TextSpan(text: '${rows.length} / ${_result?.count}', style: const TextStyle(color: AppPalette.mutedForeground)),
                              ])),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RowLabel extends StatelessWidget {
  final String text;
  const _RowLabel(this.text);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground)),
      );
}

/// One horizontally scrolling row of square logo tiles (edge to edge).
class _TileRow extends StatelessWidget {
  final List<Widget> children;
  final bool loading;
  const _TileRow({required this.children, this.loading = false});
  @override
  Widget build(BuildContext context) => SizedBox(
        height: 64,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          itemCount: loading ? 6 : children.length,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (_, i) => loading ? const SkeletonBox(width: 64, height: 64, radius: AppRadius.md) : children[i],
        ),
      );
}

class _LogoTile extends StatelessWidget {
  final String label;
  final String? image;
  final bool selected;
  final VoidCallback onTap;
  const _LogoTile({required this.label, required this.image, required this.onTap, this.selected = false});

  @override
  Widget build(BuildContext context) => Tooltip(
        message: label,
        child: Material(
          color: AppPalette.card,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            side: BorderSide(color: selected ? AppPalette.foreground : Colors.transparent, width: 2),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: SizedBox.square(
              dimension: 64,
              child: Padding(
                padding: const EdgeInsets.all(9),
                child: NetImage(
                  image,
                  fit: BoxFit.contain,
                  background: AppPalette.card,
                  fallback: Text(label.isEmpty ? '?' : label[0], style: displayStyle(18, color: AppPalette.mutedForeground)),
                ),
              ),
            ),
          ),
        ),
      );
}

// --- filters ------------------------------------------------------------------

/// Full-screen filters over a draft copy; "Хайх" applies it, the back arrow drops it.
class FiltersScreen extends StatefulWidget {
  final CarSearch initial;
  final List<Dealer> dealers;
  final List<Brand> brands;
  final List<BodyType> bodyTypes;
  const FiltersScreen({super.key, required this.initial, required this.dealers, required this.brands, required this.bodyTypes});
  @override
  State<FiltersScreen> createState() => _FiltersScreenState();
}

class _FiltersScreenState extends State<FiltersScreen> {
  static const _prices = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100, 200, 300];
  late CarSearch _d = widget.initial;
  List<CarModel> _models = [];
  bool _modelsLoading = false;

  @override
  void initState() {
    super.initState();
    if (_d.brandIds.length == 1) _loadModels(_d.brandIds.first);
  }

  Future<void> _loadModels(int brandId) async {
    setState(() => _modelsLoading = true);
    try {
      final m = await Api.getModels(brandId);
      if (mounted && _d.brandIds.firstOrNull == brandId) setState(() => _models = m);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _modelsLoading = false);
    }
  }

  List<int> get _years {
    final now = DateTime.now().year;
    return [for (var y = now; y >= 1950; y--) y];
  }

  bool get _hasFilters =>
      _d.dealerId != null ||
      _d.brandIds.isNotEmpty ||
      _d.modelId != null ||
      _d.bodyTypeIds.isNotEmpty ||
      _d.yearFrom != null ||
      _d.yearTo != null ||
      _d.importedFrom != null ||
      _d.importedTo != null ||
      _d.priceMin != null ||
      _d.priceMax != null ||
      _d.fuelTypes.isNotEmpty ||
      _d.steering != null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.muted,
      appBar: AppBar(
        title: const Text('Шүүлтүүр'),
        actions: [
          if (_hasFilters)
            TextButton(
              onPressed: () => setState(() => _d = CarSearch(sort: _d.sort, featuredFirst: true)),
              child: const Text('Цэвэрлэх', style: TextStyle(color: AppPalette.primary, fontWeight: FontWeight.w600)),
            ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          Panel(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              if (widget.dealers.isNotEmpty)
                _group(
                  'Дилер',
                  SelectField<int>(
                    label: 'Дилер',
                    placeholder: 'Бүх дилер',
                    value: _d.dealerId,
                    options: [for (final d in widget.dealers) Option(d.id, d.name)],
                    onChanged: (v) => setState(() => _d = _copy(_d, dealerId: v)),
                  ),
                  first: true,
                ),
              _group('Үйлдвэр, загвар', Column(children: [
                SelectField<int>(
                  label: 'Үйлдвэр',
                  placeholder: 'Бүх үйлдвэр',
                  value: _d.brandIds.firstOrNull,
                  options: [for (final b in widget.brands) Option(b.id, b.name)],
                  onChanged: (v) {
                    setState(() {
                      _d = _copy(_d, brandIds: v == null ? const [] : [v], modelId: null);
                      _models = [];
                    });
                    if (v != null) _loadModels(v);
                  },
                ),
                const SizedBox(height: 10),
                SelectField<int>(
                  label: 'Загвар',
                  placeholder: 'Бүх загвар',
                  value: _d.modelId,
                  enabled: _d.brandIds.isNotEmpty,
                  loading: _modelsLoading,
                  options: [for (final m in _models) Option(m.id, m.name)],
                  onChanged: (v) => setState(() => _d = _copy(_d, modelId: v)),
                ),
              ]), first: widget.dealers.isEmpty),
              if (widget.bodyTypes.isNotEmpty)
                _group(
                  'Төрөл',
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.9,
                    children: [
                      for (final b in widget.bodyTypes)
                        _BodyToggle(
                          type: b,
                          on: _d.bodyTypeIds.contains(b.id),
                          onTap: () => setState(() {
                            final on = _d.bodyTypeIds.contains(b.id);
                            _d = _copy(_d, bodyTypeIds: on ? (_d.bodyTypeIds.where((x) => x != b.id).toList()) : [..._d.bodyTypeIds, b.id]);
                          }),
                        ),
                    ],
                  ),
                ),
              _group(
                'Үнэ (сая ₮)',
                _range(
                  options: _prices,
                  from: _d.priceMin == null ? null : _d.priceMin! ~/ _mln,
                  to: _d.priceMax == null ? null : _d.priceMax! ~/ _mln,
                  onChanged: (a, b) => setState(() => _d = _copy(_d, priceMin: a == null ? null : a * _mln, priceMax: b == null ? null : b * _mln)),
                ),
              ),
              _group('Үйлдвэрлэсэн он', _range(options: _years, from: _d.yearFrom, to: _d.yearTo, onChanged: (a, b) => setState(() => _d = _copy(_d, yearFrom: a, yearTo: b)))),
              _group('Орж ирсэн он',
                  _range(options: _years, from: _d.importedFrom, to: _d.importedTo, onChanged: (a, b) => setState(() => _d = _copy(_d, importedFrom: a, importedTo: b)))),
              _group(
                'Түлш',
                Column(children: [
                  for (final f in fuelTypes)
                    InkWell(
                      onTap: () => setState(() {
                        final on = _d.fuelTypes.contains(f);
                        _d = _copy(_d, fuelTypes: on ? _d.fuelTypes.where((x) => x != f).toList() : [..._d.fuelTypes, f]);
                      }),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 7),
                        child: Row(children: [
                          _Check(on: _d.fuelTypes.contains(f)),
                          const SizedBox(width: 12),
                          Text(f, style: const TextStyle(fontSize: 15)),
                        ]),
                      ),
                    ),
                ]),
              ),
              _group(
                'Хүрд',
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: AppPalette.muted, borderRadius: BorderRadius.circular(AppRadius.md)),
                  child: Row(children: [
                    for (final s in <String?>[null, ...steerings])
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _d = _copy(_d, steering: s)),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              color: _d.steering == s ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(AppRadius.sm),
                              boxShadow: _d.steering == s ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 4)] : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(s ?? 'Бүгд', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _d.steering == s ? null : AppPalette.foreground.withValues(alpha: 0.7))),
                          ),
                        ),
                      ),
                  ]),
                ),
              ),
            ]),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: PrimaryButton(label: 'Хайх', icon: Icons.search_rounded, onTap: () => Navigator.pop(context, _copy(_d))),
        ),
      ),
    );
  }

  Widget _group(String title, Widget child, {bool first = false}) => Container(
        padding: EdgeInsets.only(top: first ? 0 : 16, bottom: 16),
        decoration: BoxDecoration(border: first ? null : const Border(top: BorderSide(color: AppPalette.border))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          child,
        ]),
      );

  /// From / to pickers; each side only offers values that keep from ≤ to.
  Widget _range({required List<int> options, int? from, int? to, required void Function(int?, int?) onChanged}) => Row(children: [
        Expanded(
          child: SelectField<int>(
            label: 'Доод',
            placeholder: 'Доод',
            value: from,
            options: [for (final v in options.where((v) => to == null || v <= to)) Option(v, '$v')],
            onChanged: (v) => onChanged(v, to),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: SelectField<int>(
            label: 'Дээд',
            placeholder: 'Дээд',
            value: to,
            options: [for (final v in options.where((v) => from == null || v >= from)) Option(v, '$v')],
            onChanged: (v) => onChanged(from, v),
          ),
        ),
      ]);
}

class _Check extends StatelessWidget {
  final bool on;
  const _Check({required this.on});
  @override
  Widget build(BuildContext context) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 20,
        height: 20,
        decoration: BoxDecoration(
          color: on ? AppPalette.primary : Colors.white,
          borderRadius: BorderRadius.circular(5),
          border: Border.all(color: on ? AppPalette.primary : AppPalette.input, width: 1.5),
        ),
        child: on ? const Icon(Icons.check_rounded, size: 15, color: Colors.white) : null,
      );
}

class _BodyToggle extends StatelessWidget {
  final BodyType type;
  final bool on;
  final VoidCallback onTap;
  const _BodyToggle({required this.type, required this.on, required this.onTap});
  @override
  Widget build(BuildContext context) => Material(
        color: on ? AppPalette.primarySoft : AppPalette.muted,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: BorderSide(color: on ? AppPalette.primary : Colors.transparent, width: 2),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Stack(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
              child: Column(children: [
                Expanded(
                  child: NetImage(
                    uploadUrl(type.image, folder: 'bodyTypes'),
                    fit: BoxFit.contain,
                    background: Colors.transparent,
                    iconSize: 26,
                  ),
                ),
                const SizedBox(height: 4),
                Text(type.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              ]),
            ),
            if (on)
              const Positioned(
                right: 6,
                top: 6,
                child: CircleAvatar(radius: 8, backgroundColor: AppPalette.primary, child: Icon(Icons.check_rounded, size: 11, color: Colors.white)),
              ),
          ]),
        ),
      );
}
