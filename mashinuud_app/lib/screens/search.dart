import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/data/car_filter.dart';
import 'package:mashinuud_app/data/filter_data.dart';
import 'package:mashinuud_app/screens/list.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

class SearchScreen extends StatefulWidget {
  /// 0: Шүүлтүүр, 1: Хадгалсан хайлт
  final int initialTab;
  final CarQuery initial;

  /// true бол үр дүнг шинэ дэлгэцээр нээхгүй, хайлтыг буцаана.
  final bool returnQuery;

  const SearchScreen({
    super.key,
    this.initialTab = 0,
    this.initial = const CarQuery(),
    this.returnQuery = false,
  });

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late final _searchController = TextEditingController(
    text: widget.initial.query,
  );
  late int _tab = widget.initialTab;
  late RangeValues _price = RangeValues(
    widget.initial.minPrice,
    widget.initial.maxPrice,
  );
  late final Map<String, String?> _selected = {
    'location': widget.initial.location,
    'brand': widget.initial.brand,
    'body': widget.initial.bodyType,
    'year': widget.initial.year,
    'mileage': widget.initial.mileage,
    'fuel': widget.initial.fuelType,
    'drive': widget.initial.driveType,
    'transmission': widget.initial.transmission,
  };

  static const _rows = [
    ('location', 'Байршил', Icons.location_on_outlined, FilterData.locations),
    ('brand', 'Брэнд', Icons.directions_car_outlined, FilterData.brands),
    ('body', 'Төрөл', Icons.category_outlined, _bodyTypes),
    ('year', 'Он', Icons.calendar_today_outlined, FilterData.years),
    ('mileage', 'Явсан км', Icons.speed_rounded, FilterData.mileages),
    (
      'fuel',
      'Шатахуун',
      Icons.local_gas_station_outlined,
      FilterData.fuelTypes,
    ),
    ('drive', 'Хөтлөгч', Icons.all_inclusive_rounded, FilterData.driveTypes),
    (
      'transmission',
      'Хурдны хайрцаг',
      Icons.settings_outlined,
      FilterData.transmissions,
    ),
  ];
  static const _bodyTypes = ['Бүх төрөл', 'Седан', 'Жийп', 'Хэтчбэк', 'Пикап'];

  CarQuery get _query => CarQuery(
    query: _searchController.text,
    minPrice: _price.start,
    maxPrice: _price.end,
    location: _selected['location'],
    brand: _selected['brand'],
    bodyType: _selected['body'],
    year: _selected['year'],
    mileage: _selected['mileage'],
    fuelType: _selected['fuel'],
    driveType: _selected['drive'],
    transmission: _selected['transmission'],
  );

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _reset() => setState(() {
    _searchController.clear();
    _price = const RangeValues(0, maxPriceLimit);
    _selected.updateAll((_, _) => null);
  });

  void _showResults(CarQuery query, {String title = 'Хайлтын үр дүн'}) {
    if (widget.returnQuery) {
      Navigator.pop(context, query);
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ListScreen(title: title, query: query),
      ),
    );
  }

  Future<void> _saveSearch() async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Хайлт хадгалах'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Нэр (ж: Toyota жийп)'),
          onSubmitted: (v) => Navigator.pop(context, v),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Болих'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Хадгалах'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (name == null || name.trim().isEmpty) return;
    setState(() {
      savedSearches.insert(0, SavedSearch(name.trim(), _query));
      _tab = 1;
    });
  }

  Future<void> _pick(String key, String title, List<String> options) async {
    final current = _selected[key] ?? options.first;
    final value = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppPalette.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.6,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final o in options)
                      ListTile(
                        title: Text(o, style: const TextStyle(fontSize: 17)),
                        trailing: o == current
                            ? const Icon(
                                Icons.check_rounded,
                                color: AppPalette.primary,
                              )
                            : null,
                        onTap: () => Navigator.pop(context, o),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (value != null) {
      setState(() => _selected[key] = value == options.first ? null : value);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.background,
      body: Column(
        children: [
          _header(),
          const Divider(height: 1, color: AppPalette.border),
          Expanded(child: _tab == 0 ? _filters() : _saved()),
          if (_tab == 0) _bottomBar(),
        ],
      ),
    );
  }

  Widget _header() {
    return Container(
      color: AppPalette.surface,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          child: Column(
            children: [
              Row(
                children: [
                  SquareIconButton(
                    icon: Icons.chevron_left_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Text('Хайлт', style: displayStyle(30))),
                  if (_tab == 0)
                    TextButton(
                      onPressed: _reset,
                      child: const Text(
                        'Цэвэрлэх',
                        style: TextStyle(
                          color: AppPalette.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              SearchField(
                hint: 'Брэнд, загвар, түлхүүр үг',
                controller: _searchController,
                fill: AppPalette.background,
                bordered: false,
                onSubmitted: (_) => setState(() {}),
              ),
              const SizedBox(height: 14),
              SegmentedPicker(
                options: const ['Шүүлтүүр', 'Хадгалсан хайлт'],
                selected: _tab,
                expand: true,
                onChanged: (i) => setState(() => _tab = i),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _filters() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    flex: 1,
                    child: Text(
                      'Үнэ',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Flexible(
                    flex: 3,
                    child: Text(
                      '${_shortPrice(_price.start)} – ${_shortPrice(_price.end, max: true)}',
                      textAlign: TextAlign.end,
                      style: const TextStyle(
                        color: AppPalette.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: AppPalette.primary,
                  inactiveTrackColor: AppPalette.chipGrey,
                  thumbColor: AppPalette.surface,
                  overlayColor: AppPalette.primary.withValues(alpha: 0.1),
                  trackHeight: 5,
                  rangeThumbShape: const RoundRangeSliderThumbShape(
                    enabledThumbRadius: 12,
                    elevation: 3,
                  ),
                ),
                child: RangeSlider(
                  values: _price,
                  max: maxPriceLimit,
                  divisions: 80,
                  onChanged: (v) => setState(() => _price = v),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        AppCard(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            children: [
              for (final (key, label, icon, options) in _rows)
                InkWell(
                  onTap: () => _pick(key, label, options),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    child: Row(
                      children: [
                        Icon(icon, color: AppPalette.muted, size: 22),
                        const SizedBox(width: 14),
                        Flexible(
                          child: Text(
                            label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _selected[key] ?? options.first,
                            textAlign: TextAlign.end,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 15,
                              color: _selected[key] == null
                                  ? AppPalette.muted
                                  : AppPalette.primary,
                              fontWeight: _selected[key] == null
                                  ? FontWeight.w400
                                  : FontWeight.w700,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: AppPalette.muted,
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Center(
          child: TextButton.icon(
            onPressed: _saveSearch,
            icon: const Icon(Icons.bookmark_add_outlined),
            label: const Text(
              'Энэ хайлтыг хадгалах',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _saved() {
    if (savedSearches.isEmpty) {
      return const Center(
        child: Text(
          'Хадгалсан хайлт алга',
          style: TextStyle(color: AppPalette.muted, fontSize: 16),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      children: [
        for (final s in savedSearches)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: AppCard(
              padding: const EdgeInsets.fromLTRB(18, 16, 8, 16),
              onTap: () => _showResults(s.query, title: s.title),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppPalette.primaryTint,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.manage_search_rounded,
                      color: AppPalette.primary,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.title,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          s.summary,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: AppPalette.muted),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${s.query.apply(carData).length} зар',
                          style: const TextStyle(
                            color: AppPalette.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(() => savedSearches.remove(s)),
                    icon: const Icon(
                      Icons.delete_outline_rounded,
                      color: AppPalette.muted,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _bottomBar() {
    final count = _query.apply(carData).length;
    return Container(
      decoration: const BoxDecoration(
        color: AppPalette.surface,
        border: Border(top: BorderSide(color: AppPalette.border)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
          child: SizedBox(
            width: double.infinity,
            child: PrimaryButton(
              label: '$count зар харах',
              onPressed: count == 0 ? null : () => _showResults(_query),
            ),
          ),
        ),
      ),
    );
  }

  static String _shortPrice(double v, {bool max = false}) {
    if (max && v >= maxPriceLimit) return 'Дээд хязгааргүй';
    if (v == 0) return '0₮';
    return '${formatNumber(v / 1000000)} сая₮';
  }
}
