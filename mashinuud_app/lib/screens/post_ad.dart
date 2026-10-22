import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/data/filter_data.dart';
import 'package:mashinuud_app/services/vehicleLookupService.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

const _stepCount = 4;
const _maxPhotos = 20;
const _models = {
  'Toyota': [
    'Prius 30',
    'Prius 50',
    'Land Cruiser 200',
    'Land Cruiser 300',
    'RAV4',
    'Prado 150',
    'Highlander',
  ],
  'Lexus': ['RX 350', 'RX 450h', 'LX 570', 'NX 300h'],
  'Hyundai': ['Tucson', 'Santa Fe', 'Elantra'],
  'Nissan': ['X-Trail', 'Leaf', 'Patrol'],
};
const _fuels = ['Бензин', 'Дизель', 'Хайбрид', 'Газ', 'Цахилгаан'];
const _engines = [
  '1.0',
  '1.3',
  '1.5',
  '1.8',
  '2.0',
  '2.5',
  '2.8',
  '3.0',
  '3.5',
  '4.0',
  '4.5',
  '4.6',
  '5.7',
];
const _drives = ['FWD', 'RWD', '4WD'];
const _transmissions = ['Автомат', 'Механик', 'CVT', 'Типтроник'];
const _steerings = ['Зүүн', 'Баруун'];
const _doors = ['2', '3', '4', '5'];
const _colors = [
  'Цагаан',
  'Хар',
  'Саарал',
  'Мөнгөлөг',
  'Улаан',
  'Цэнхэр',
  'Бусад',
];
const _tints = [
  AppPalette.tintBlue,
  AppPalette.tintYellow,
  AppPalette.tintGreen,
  AppPalette.tintLavender,
  AppPalette.tintPink,
];

class PostAdScreen extends StatefulWidget {
  const PostAdScreen({super.key});

  @override
  State<PostAdScreen> createState() => _PostAdScreenState();
}

class _PostAdScreenState extends State<PostAdScreen> {
  final _plate = TextEditingController();
  final _vin = TextEditingController();
  final _price = TextEditingController();
  final _mileage = TextEditingController();
  final _description = TextEditingController();

  int _step = 0;

  // 1. Дугаараар хайх
  bool _searching = false;
  String? _lookupError;
  VehicleInfo? _found;

  // 2. Ерөнхий мэдээлэл
  int _photos = 0;
  String? _brand;
  String? _model;
  String? _year;
  String? _importYear;
  String? _location = 'Улаанбаатар';

  // 3. Техникийн мэдээлэл
  String? _fuel;
  String? _drive;
  String? _transmission;
  String? _engine;
  String? _doorCount;
  String? _steering;
  String? _color;
  bool _diagnosis = false;
  bool _leasing = false;

  @override
  void dispose() {
    _plate.dispose();
    _vin.dispose();
    _price.dispose();
    _mileage.dispose();
    _description.dispose();
    super.dispose();
  }

  List<String> get _years => [
    for (var y = DateTime.now().year; y >= 1995; y--) '$y',
  ];

  bool get _canSearch =>
      _plate.text.trim().isNotEmpty || _vin.text.trim().isNotEmpty;

  Future<void> _search() async {
    if (!_canSearch || _searching) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _searching = true;
      _lookupError = null;
    });
    try {
      final info = await VehicleLookupService.lookup(
        plate: _plate.text,
        vin: _vin.text,
      );
      if (!mounted) return;
      setState(() {
        _apply(info);
        _found = info;
        _searching = false;
        _step = 1;
      });
    } on VehicleLookupException catch (e) {
      if (!mounted) return;
      setState(() {
        _lookupError = e.message;
        _searching = false;
      });
    }
  }

  /// Хайлтаас ирсэн утгуудаар маягтыг бөглөнө (ирээгүй талбарыг хэвээр үлдээнэ).
  void _apply(VehicleInfo info) {
    _brand = info.brand ?? _brand;
    _model = info.model ?? _model;
    _year = info.manufacturedYear?.toString() ?? _year;
    _importYear = info.importedYear?.toString() ?? _importYear;
    _fuel = info.fuelType ?? _fuel;
    _drive = info.driveType ?? _drive;
    _transmission = info.transmission ?? _transmission;
    _engine = info.engineCapacity?.toStringAsFixed(1) ?? _engine;
    _doorCount = info.doorCount?.toString() ?? _doorCount;
    _steering = info.steering ?? _steering;
    _color = info.color ?? _color;
    if (info.plate != null) _plate.text = info.plate!;
    if (info.vin != null) _vin.text = info.vin!;
  }

  Future<void> _pick(
    String title,
    List<String> options,
    String? current,
    ValueChanged<String> onPicked,
  ) async {
    final value = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppPalette.surface,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.55,
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
    if (value != null) setState(() => onPicked(value));
  }

  String? _missingGeneral() {
    if (_brand == null) return 'Брэнд сонгоно уу';
    if (_year == null) return 'Үйлдвэрлэсэн он сонгоно уу';
    if (_price.text.trim().isEmpty) return 'Үнэ оруулна уу';
    return null;
  }

  String? _missingTech() {
    if (_transmission == null) return 'Хурдны хайрцаг сонгоно уу';
    return null;
  }

  void _next() {
    FocusScope.of(context).unfocus();
    if (_step == 1 || _step == 2) {
      final missing = _step == 1 ? _missingGeneral() : _missingTech();
      if (missing != null) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(content: Text(missing)));
        return;
      }
    }
    if (_step < _stepCount - 1) {
      setState(() => _step++);
      return;
    }
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Таны зар амжилттай нийтлэгдлээ')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => _step--);
      },
      child: Scaffold(
        backgroundColor: AppPalette.surface,
        body: Column(
          children: [
            _header(),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                children: switch (_step) {
                  0 => _lookupStep(),
                  1 => _generalStep(),
                  2 => _techStep(),
                  _ => _previewStep(),
                },
              ),
            ),
            _bottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _header() {
    const actionStyle = TextStyle(fontSize: 16, fontWeight: FontWeight.w600);
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 16),
        child: Column(
          children: [
            Row(
              children: [
                SizedBox(
                  width: 96,
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      style: TextButton.styleFrom(
                        foregroundColor: AppPalette.ink,
                      ),
                      child: const Text('Цуцлах', style: actionStyle),
                    ),
                  ),
                ),
                const Expanded(
                  child: Text(
                    'Зар оруулах',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                ),
                SizedBox(
                  width: 96,
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: _step == _stepCount - 1
                        ? null
                        : TextButton(
                            onPressed: _step == 0
                                ? () => setState(() => _step = 1)
                                : _next,
                            child: Text(
                              _step == 0 ? 'Алгасах' : 'Дараах',
                              style: actionStyle,
                            ),
                          ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _stepper(),
          ],
        ),
      ),
    );
  }

  Widget _stepper() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < _stepCount; i++) ...[
          if (i > 0)
            Container(
              width: 32,
              height: 2,
              margin: const EdgeInsets.symmetric(horizontal: 6),
              color: i <= _step ? AppPalette.primary : AppPalette.border,
            ),
          GestureDetector(
            onTap: i < _step ? () => setState(() => _step = i) : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 30,
              height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: i == _step
                    ? AppPalette.primary
                    : i < _step
                    ? AppPalette.primaryTint
                    : AppPalette.chipGrey,
              ),
              child: Text(
                '${i + 1}',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: i == _step
                      ? Colors.white
                      : i < _step
                      ? AppPalette.primary
                      : AppPalette.muted,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _title(String text) => Padding(
    padding: const EdgeInsets.only(top: 12, bottom: 12),
    child: Text(
      text,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
    ),
  );

  Widget _boxInput(
    TextEditingController controller,
    String hint, {
    int maxLines = 1,
    bool upperCase = false,
    IconData? icon,
    ValueChanged<String>? onSubmitted,
  }) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppPalette.border),
    );
    return TextField(
      controller: controller,
      maxLines: maxLines,
      textCapitalization: upperCase
          ? TextCapitalization.characters
          : TextCapitalization.sentences,
      inputFormatters: upperCase ? [_UpperCaseFormatter()] : null,
      onChanged: (_) => setState(() => _lookupError = null),
      onSubmitted: onSubmitted,
      style: const TextStyle(fontSize: 17),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppPalette.muted),
        prefixIcon: icon == null ? null : Icon(icon, color: AppPalette.muted),
        filled: true,
        fillColor: AppPalette.surface,
        contentPadding: const EdgeInsets.all(18),
        border: border,
        enabledBorder: border,
        focusedBorder: border.copyWith(
          borderSide: const BorderSide(color: AppPalette.primary, width: 1.5),
        ),
      ),
    );
  }

  /// Дизайны "шошго ← → утга ⌄" мөр.
  Widget _row(String label, Widget trailing, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 56),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppPalette.border)),
        ),
        child: Row(
          children: [
            Flexible(child: Text(label, style: const TextStyle(fontSize: 16))),
            const SizedBox(width: 16),
            Expanded(
              child: Align(alignment: Alignment.centerRight, child: trailing),
            ),
          ],
        ),
      ),
    );
  }

  Widget _selectRow(
    String label,
    String? value,
    List<String> options,
    ValueChanged<String> onPicked,
  ) {
    return _row(
      label,
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Flexible(
            child: Text(
              value ?? 'Сонгох',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 16,
                color: value == null ? AppPalette.muted : AppPalette.ink,
              ),
            ),
          ),
          const SizedBox(width: 4),
          const Icon(
            Icons.keyboard_arrow_down_rounded,
            color: AppPalette.muted,
          ),
        ],
      ),
      onTap: () => _pick(label, options, value, onPicked),
    );
  }

  Widget _numberRow(
    String label,
    TextEditingController controller, {
    String? suffix,
  }) {
    return _row(
      label,
      SizedBox(
        width: 180,
        child: TextField(
          controller: controller,
          textAlign: TextAlign.right,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (_) => setState(() {}),
          style: const TextStyle(fontSize: 16),
          decoration: InputDecoration(
            isDense: true,
            hintText: '0',
            hintStyle: const TextStyle(color: AppPalette.muted),
            suffixText: suffix,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ),
    );
  }

  Widget _switchRow(
    String title,
    String subtitle,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      value: value,
      activeTrackColor: AppPalette.primary,
      onChanged: (v) => setState(() => onChanged(v)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      subtitle: Text(subtitle),
    );
  }

  List<Widget> _lookupStep() {
    return [
      _title('Машины дугаар'),
      const Text(
        'Улсын дугаар эсвэл арлын дугаараа оруулбал машины мэдээлэл '
        'автоматаар бөглөгдөнө.',
        style: TextStyle(color: AppPalette.muted, fontSize: 15, height: 1.4),
      ),
      const SizedBox(height: 20),
      const Text('Улсын дугаар', style: TextStyle(fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      _boxInput(
        _plate,
        '1234 УБА',
        upperCase: true,
        icon: Icons.pin_outlined,
        onSubmitted: (_) => _search(),
      ),
      const SizedBox(height: 18),
      const Text(
        'Арлын дугаар (VIN)',
        style: TextStyle(fontWeight: FontWeight.w700),
      ),
      const SizedBox(height: 8),
      _boxInput(
        _vin,
        'ZVW30-1234567',
        upperCase: true,
        icon: Icons.qr_code_2_rounded,
        onSubmitted: (_) => _search(),
      ),
      if (_lookupError != null) ...[
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppPalette.redTint,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: AppPalette.red),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _lookupError!,
                  style: const TextStyle(color: AppPalette.redText),
                ),
              ),
            ],
          ),
        ),
      ],
      const SizedBox(height: 24),
      Center(
        child: TextButton.icon(
          onPressed: () => setState(() => _step = 1),
          iconAlignment: IconAlignment.end,
          icon: const Icon(Icons.arrow_forward_rounded),
          label: const Text(
            'Алгасаад гараар бөглөх',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ),
    ];
  }

  Widget _foundBanner(VehicleInfo info) {
    final id = info.plate ?? info.vin ?? '';
    return Container(
      margin: const EdgeInsets.only(top: 8, bottom: 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppPalette.greenTint,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppPalette.green),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '$id дугаартай машины мэдээлэл бөглөгдлөө. Шалгаад, '
              'дутуу мэдээллээ нөхнө үү.',
              style: const TextStyle(color: AppPalette.green, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }

  Widget _photoBox() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppPalette.background,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Зураг нэмэх ($_photos/$_maxPhotos)',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          if (_photos == 0)
            InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => setState(() => _photos++),
              child: const SizedBox(
                height: 110,
                width: double.infinity,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.photo_camera_rounded,
                      color: AppPalette.primary,
                      size: 30,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Зургаа нэмнэ үү',
                      style: TextStyle(color: AppPalette.muted),
                    ),
                  ],
                ),
              ),
            )
          else
            SizedBox(
              height: 84,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _photos < _maxPhotos ? _photos + 1 : _photos,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (_, i) => i == _photos
                    ? GestureDetector(
                        onTap: () => setState(() => _photos++),
                        child: CustomPaint(
                          painter: _DashedBorderPainter(),
                          child: const SizedBox(
                            width: 84,
                            child: Icon(
                              Icons.add_a_photo_outlined,
                              color: AppPalette.primary,
                            ),
                          ),
                        ),
                      )
                    : Stack(
                        children: [
                          CarThumb(
                            tint: _tints[i % _tints.length],
                            width: 84,
                            height: 84,
                            carWidth: 56,
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () => setState(() => _photos--),
                              child: const CircleAvatar(
                                radius: 11,
                                backgroundColor: Colors.black54,
                                child: Icon(
                                  Icons.close_rounded,
                                  size: 14,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _generalStep() {
    return [
      if (_found != null) _foundBanner(_found!),
      _title('Ерөнхий мэдээлэл'),
      _photoBox(),
      const SizedBox(height: 8),
      _selectRow(
        'Брэнд',
        _brand,
        FilterData.brands.skip(1).toList(),
        (v) {
          if (v != _brand) _model = null;
          _brand = v;
        },
      ),
      _selectRow(
        'Загвар',
        _model,
        _models[_brand] ?? const ['Бусад'],
        (v) => _model = v,
      ),
      _selectRow('Он', _year, _years, (v) => _year = v),
      _selectRow(
        'Орж ирсэн он',
        _importYear,
        _years,
        (v) => _importYear = v,
      ),
      _numberRow('Үнэ', _price, suffix: '₮'),
      _numberRow('Явсан км', _mileage, suffix: 'км'),
      _selectRow(
        'Байршил',
        _location,
        FilterData.locations.skip(1).toList(),
        (v) => _location = v,
      ),
    ];
  }

  List<Widget> _techStep() {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppPalette.border),
    );
    return [
      _title('Техникийн мэдээлэл'),
      _selectRow('Шатахуун', _fuel, _fuels, (v) => _fuel = v),
      _selectRow('Хөтлөгч', _drive, _drives, (v) => _drive = v),
      _selectRow(
        'Хурдны хайрцаг',
        _transmission,
        _transmissions,
        (v) => _transmission = v,
      ),
      _selectRow(
        'Хөдөлгүүрийн багтаамж',
        _engine,
        _engines,
        (v) => _engine = v,
      ),
      _selectRow('Хаалганы тоо', _doorCount, _doors, (v) => _doorCount = v),
      _selectRow('Хүрд', _steering, _steerings, (v) => _steering = v),
      _selectRow('Өнгө', _color, _colors, (v) => _color = v),
      const SizedBox(height: 12),
      _title('Тодорхойлолт'),
      TextField(
        controller: _description,
        maxLines: 6,
        textCapitalization: TextCapitalization.sentences,
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          hintText: 'Нэмэлт мэдээллээ бичнэ үү...',
          hintStyle: const TextStyle(color: AppPalette.muted),
          contentPadding: const EdgeInsets.all(16),
          border: border,
          enabledBorder: border,
          focusedBorder: border.copyWith(
            borderSide: const BorderSide(
              color: AppPalette.primary,
              width: 1.5,
            ),
          ),
        ),
      ),
      const SizedBox(height: 12),
      _switchRow(
        'Оношилгоонд хамруулах',
        '“Оношилгоотой” тэмдэг авч, илүү хурдан зарна',
        _diagnosis,
        (v) => _diagnosis = v,
      ),
      _switchRow(
        'Лизинг боломжтой',
        'Худалдан авагч лизингээр авч болно',
        _leasing,
        (v) => _leasing = v,
      ),
    ];
  }

  List<Widget> _previewStep() {
    final price = int.tryParse(_price.text);
    final mileage = int.tryParse(_mileage.text);
    final name = [_brand, _model, _year].whereType<String>().join(' ');
    return [
      _title('Харах'),
      SizedBox(
        height: 200,
        child: Row(
          children: [
            const Expanded(
              flex: 2,
              child: CarThumb(
                tint: AppPalette.tintBlue,
                height: double.infinity,
                carWidth: 170,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                children: [
                  for (var i = 1; i < 3; i++) ...[
                    if (i > 1) const SizedBox(height: 10),
                    Expanded(
                      child: i < _photos
                          ? CarThumb(
                              tint: _tints[i],
                              height: double.infinity,
                              carWidth: 70,
                            )
                          : const SizedBox.shrink(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 18),
      Text(name.isEmpty ? 'Нэргүй машин' : name, style: displayStyle(24)),
      const SizedBox(height: 6),
      PriceText(
        price == null ? 'Үнэ оруулаагүй' : formatPrice(price),
        size: 24,
      ),
      const SizedBox(height: 8),
      Row(
        children: [
          const Icon(
            Icons.location_on_outlined,
            size: 18,
            color: AppPalette.muted,
          ),
          const SizedBox(width: 4),
          Text(
            _location ?? 'Байршил сонгоогүй',
            style: const TextStyle(color: AppPalette.muted),
          ),
        ],
      ),
      const SizedBox(height: 14),
      Wrap(
        spacing: 16,
        runSpacing: 10,
        children: [
          for (final (icon, value) in [
            (
              Icons.speed_rounded,
              mileage == null ? '— км' : '${formatNumber(mileage)} км',
            ),
            (Icons.local_gas_station_outlined, _fuel ?? '—'),
            (Icons.settings_outlined, _transmission ?? '—'),
            (Icons.all_inclusive_rounded, _drive ?? '—'),
          ])
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 18, color: AppPalette.inkSoft),
                const SizedBox(width: 6),
                Text(
                  value,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
        ],
      ),
      if (_diagnosis || _leasing) ...[
        const SizedBox(height: 14),
        Wrap(
          spacing: 10,
          runSpacing: 8,
          children: [
            if (_diagnosis)
              const Tag.verified(label: 'Оношилгоонд хамрагдана'),
            if (_leasing)
              const Tag(
                label: 'Лизинг боломжтой',
                background: AppPalette.accentTint,
              ),
          ],
        ),
      ],
      if (_description.text.trim().isNotEmpty) ...[
        const SizedBox(height: 16),
        Text(
          _description.text.trim(),
          style: const TextStyle(
            color: AppPalette.muted,
            fontSize: 15,
            height: 1.5,
          ),
        ),
      ],
    ];
  }

  Widget _bottomBar() {
    final isLookup = _step == 0;
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
        child: SizedBox(
          width: double.infinity,
          child: isLookup && _searching
              ? const SizedBox(
                  height: 60,
                  child: Center(child: CircularProgressIndicator()),
                )
              : PrimaryButton(
                  label: isLookup
                      ? 'Хайх'
                      : _step == _stepCount - 1
                      ? 'Зар нийтлэх'
                      : 'Дараах',
                  icon: isLookup ? Icons.search_rounded : null,
                  onPressed: isLookup
                      ? (_canSearch ? _search : null)
                      : _next,
                ),
        ),
      ),
    );
  }
}

class _UpperCaseFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) => newValue.copyWith(text: newValue.text.toUpperCase());
}

class _DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppPalette.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      const Radius.circular(18),
    );
    final path = Path()..addRRect(rrect.deflate(1));
    for (final metric in path.computeMetrics()) {
      for (double d = 0; d < metric.length; d += 9) {
        canvas.drawPath(metric.extractPath(d, d + 5), paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorderPainter old) => false;
}
