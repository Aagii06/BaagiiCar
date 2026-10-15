import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/data/filter_data.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

const _steps = ['Машин', 'Зураг', 'Үнэ', 'Нийтлэх'];
const _models = {
  'Toyota': ['Prius 30', 'Prius 50', 'Land Cruiser 200', 'Land Cruiser 300', 'RAV4', 'Prado 150', 'Highlander'],
  'Lexus': ['RX 450h', 'LX 570', 'NX 300h'],
  'Hyundai': ['Tucson', 'Santa Fe', 'Elantra'],
  'Nissan': ['X-Trail', 'Leaf', 'Patrol'],
};
const _fuels = ['Бензин', 'Дизель', 'Хайбрид', 'Цахилгаан'];

class PostAdScreen extends StatefulWidget {
  const PostAdScreen({super.key});

  @override
  State<PostAdScreen> createState() => _PostAdScreenState();
}

class _PostAdScreenState extends State<PostAdScreen> {
  final _mileage = TextEditingController();
  final _price = TextEditingController();
  final _description = TextEditingController();

  int _step = 0;
  String _brand = 'Toyota';
  String? _model = 'Prius 30';
  String? _year = '2012';
  String? _importYear;
  String? _fuel = 'Хайбрид';
  int _transmission = 0;
  int _steering = 0;
  bool _diagnosis = true;
  bool _leasing = false;
  int _photos = 3;

  @override
  void dispose() {
    _mileage.dispose();
    _price.dispose();
    _description.dispose();
    super.dispose();
  }

  List<String> get _years =>
      [for (var y = DateTime.now().year; y >= 1995; y--) '$y'];

  Future<void> _pick(
    String title,
    List<String> options,
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
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final o in options)
                      ListTile(
                        title: Text(o, style: const TextStyle(fontSize: 17)),
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

  void _next() {
    if (_step < _steps.length - 1) {
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
    return Scaffold(
      backgroundColor: AppPalette.background,
      body: Column(
        children: [
          _header(),
          const Divider(height: 1, color: AppPalette.border),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
              children: switch (_step) {
                0 => _carStep(),
                1 => _photoStep(),
                2 => _priceStep(),
                _ => _publishStep(),
              },
            ),
          ),
          _bottomBar(),
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
                    icon: Icons.close_rounded,
                    size: 56,
                    onTap: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 18),
                  Expanded(child: Text('Зар оруулах', style: displayStyle(30))),
                  Text(
                    '${_step + 1} / ${_steps.length}',
                    style: const TextStyle(
                      color: AppPalette.muted,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  for (var i = 0; i < _steps.length; i++) ...[
                    if (i > 0) const SizedBox(width: 10),
                    Expanded(
                      child: GestureDetector(
                        onTap: i < _step ? () => setState(() => _step = i) : null,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              height: 6,
                              decoration: BoxDecoration(
                                color: i <= _step
                                    ? AppPalette.primary
                                    : AppPalette.chipGrey,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              _steps[i],
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: i == _step
                                    ? AppPalette.ink
                                    : AppPalette.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(
      text,
      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
    ),
  );

  Widget _dropdown(String? value, String hint, VoidCallback onTap) {
    return Material(
      color: AppPalette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppPalette.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  value ?? hint,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 18,
                    color: value == null ? AppPalette.muted : AppPalette.ink,
                  ),
                ),
              ),
              const Icon(Icons.keyboard_arrow_down_rounded),
            ],
          ),
        ),
      ),
    );
  }

  Widget _textInput(
    TextEditingController controller,
    String hint, {
    bool number = false,
    int maxLines = 1,
    String? suffix,
  }) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: AppPalette.border),
    );
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      inputFormatters: number ? [FilteringTextInputFormatter.digitsOnly] : null,
      onChanged: (_) => setState(() {}),
      style: const TextStyle(fontSize: 18),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppPalette.muted),
        suffixText: suffix,
        filled: true,
        fillColor: AppPalette.surface,
        contentPadding: const EdgeInsets.all(20),
        border: border,
        enabledBorder: border,
        focusedBorder: border.copyWith(
          borderSide: const BorderSide(color: AppPalette.primary, width: 1.5),
        ),
      ),
    );
  }

  Widget _pair(Widget left, Widget right) => Padding(
    padding: const EdgeInsets.only(bottom: 18),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: left),
        const SizedBox(width: 20),
        Expanded(child: right),
      ],
    ),
  );

  Widget _field(String label, Widget input) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [_label(label), input],
  );

  Widget _photoRow() {
    const tints = [AppPalette.tintBlue, AppPalette.tintYellow, AppPalette.tintGreen];
    return Row(
      children: [
        Expanded(
          child: AspectRatio(
            aspectRatio: 1,
            child: GestureDetector(
              onTap: () => setState(() => _photos = (_photos + 1).clamp(0, 8)),
              child: CustomPaint(
                painter: _DashedBorderPainter(),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.photo_camera_outlined, color: AppPalette.primary),
                    SizedBox(height: 4),
                    Text(
                      'Нэмэх',
                      style: TextStyle(
                        color: AppPalette.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        for (var i = 0; i < 3; i++) ...[
          const SizedBox(width: 12),
          Expanded(
            child: AspectRatio(
              aspectRatio: 1,
              child: i < _photos
                  ? CarThumb(tint: tints[i], height: double.infinity, carWidth: 60)
                  : const SizedBox.shrink(),
            ),
          ),
        ],
      ],
    );
  }

  List<Widget> _carStep() {
    return [
      const Text.rich(
        TextSpan(
          text: 'Зураг ',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          children: [
            TextSpan(
              text: '(8 хүртэл)',
              style: TextStyle(
                fontSize: 16,
                color: AppPalette.muted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 14),
      _photoRow(),
      const SizedBox(height: 24),
      _pair(
        _field(
          'Үйлдвэр',
          _dropdown(
            _brand,
            'Сонгох',
            () => _pick('Үйлдвэр', FilterData.brands.skip(1).toList(), (v) {
              _brand = v;
              _model = null;
            }),
          ),
        ),
        _field(
          'Загвар',
          _dropdown(
            _model,
            'Сонгох',
            () => _pick('Загвар', _models[_brand] ?? const ['Бусад'], (v) => _model = v),
          ),
        ),
      ),
      _pair(
        _field(
          'Үйлдвэрлэсэн он',
          _dropdown(_year, 'Он', () => _pick('Үйлдвэрлэсэн он', _years, (v) => _year = v)),
        ),
        _field(
          'Орж ирсэн он',
          _dropdown(
            _importYear,
            'Он',
            () => _pick('Орж ирсэн он', _years, (v) => _importYear = v),
          ),
        ),
      ),
      _pair(
        _field('Гүйлт (км)', _textInput(_mileage, '0', number: true)),
        _field(
          'Түлш',
          _dropdown(_fuel, 'Сонгох', () => _pick('Түлш', _fuels, (v) => _fuel = v)),
        ),
      ),
      _label('Хурдны хайрцаг'),
      SegmentedPicker(
        options: const ['Автомат', 'Механик', 'Вариатор'],
        selected: _transmission,
        height: 64,
        expand: true,
        onChanged: (i) => setState(() => _transmission = i),
      ),
      const SizedBox(height: 18),
      _label('Хүрд'),
      SegmentedPicker(
        options: const ['Зүүн', 'Баруун'],
        selected: _steering,
        height: 64,
        expand: true,
        onChanged: (i) => setState(() => _steering = i),
      ),
      const SizedBox(height: 22),
      AppCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        onTap: () => setState(() => _diagnosis = !_diagnosis),
        child: Row(
          children: [
            Checkbox(
              value: _diagnosis,
              activeColor: AppPalette.primary,
              onChanged: (v) => setState(() => _diagnosis = v ?? false),
            ),
            const SizedBox(width: 8),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Оношилгоонд хамруулах',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                  ),
                  SizedBox(height: 2),
                  Text(
                    '“Оношилгоотой” тэмдэг авч, илүү хурдан зарна',
                    style: TextStyle(color: AppPalette.muted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ];
  }

  List<Widget> _photoStep() {
    return [
      Text('Зургаа нэмнэ үү', style: displayStyle(24)),
      const SizedBox(height: 8),
      const Text(
        'Гадна, дотор, хөдөлгүүрийн зургийг оруулбал илүү олон хүн үзнэ.',
        style: TextStyle(color: AppPalette.muted, fontSize: 16),
      ),
      const SizedBox(height: 20),
      _photoRow(),
      const SizedBox(height: 16),
      Text(
        '$_photos / 8 зураг',
        style: const TextStyle(color: AppPalette.muted, fontWeight: FontWeight.w600),
      ),
    ];
  }

  List<Widget> _priceStep() {
    return [
      _field('Үнэ', _textInput(_price, '0', number: true, suffix: '₮')),
      const SizedBox(height: 18),
      _field(
        'Тайлбар',
        _textInput(_description, 'Машины байдал, нэмэлт мэдээлэл...', maxLines: 5),
      ),
      const SizedBox(height: 18),
      AppCard(
        padding: const EdgeInsets.fromLTRB(20, 8, 12, 8),
        child: SwitchListTile(
          contentPadding: EdgeInsets.zero,
          value: _leasing,
          activeTrackColor: AppPalette.primary,
          onChanged: (v) => setState(() => _leasing = v),
          title: const Text(
            'Лизинг боломжтой',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
          ),
          subtitle: const Text('Худалдан авагч лизингээр авч болно'),
        ),
      ),
    ];
  }

  List<Widget> _publishStep() {
    final price = int.tryParse(_price.text);
    final rows = [
      ('Машин', '$_brand ${_model ?? ''}'.trim()),
      ('Он', _year ?? '—'),
      ('Гүйлт', _mileage.text.isEmpty ? '—' : '${formatNumber(int.parse(_mileage.text))} км'),
      ('Түлш', _fuel ?? '—'),
      ('Хурдны хайрцаг', const ['Автомат', 'Механик', 'Вариатор'][_transmission]),
      ('Зураг', '$_photos'),
      ('Үнэ', price == null ? '—' : formatPrice(price)),
    ];
    return [
      Text('Шалгаад нийтлээрэй', style: displayStyle(24)),
      const SizedBox(height: 18),
      AppCard(
        child: Column(
          children: [
            for (final (label, value) in rows)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(label, style: const TextStyle(color: AppPalette.muted)),
                    ),
                    Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
          ],
        ),
      ),
      const SizedBox(height: 14),
      Wrap(
        spacing: 10,
        children: [
          if (_diagnosis) const Tag.verified(label: 'Оношилгоонд хамрагдана'),
          if (_leasing)
            const Tag(label: 'Лизинг боломжтой', background: AppPalette.accentTint),
        ],
      ),
    ];
  }

  Widget _bottomBar() {
    return Container(
      decoration: const BoxDecoration(
        color: AppPalette.surface,
        border: Border(top: BorderSide(color: AppPalette.border)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
          child: Row(
            children: [
              OutlineButton(
                label: _step == 0 ? 'Ноорог' : 'Буцах',
                onPressed: () => _step == 0
                    ? Navigator.pop(context)
                    : setState(() => _step--),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: PrimaryButton(
                  label: _step == _steps.length - 1 ? 'Нийтлэх' : 'Үргэлжлүүлэх',
                  onPressed: _next,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
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
