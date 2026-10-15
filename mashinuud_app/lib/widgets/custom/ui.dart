import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';

/// Дизайн дахь машины шугаман дүрс.
class CarOutline extends StatelessWidget {
  final double width;
  final Color color;

  const CarOutline({super.key, this.width = 160, this.color = AppPalette.ink});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(width, width * 0.3),
      painter: _CarOutlinePainter(color),
    );
  }
}

class _CarOutlinePainter extends CustomPainter {
  final Color color;

  _CarOutlinePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    // 100 x 30 сүлжээн дээр зурж, хэмжээнд нь томруулна.
    final s = size.width / 100;
    Offset p(double x, double y) => Offset(x * s, y * s);

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = (s * 1.8).clamp(1.2, 4.0)
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round;

    final path = Path();
    void move(double x, double y) => path.moveTo(x * s, y * s);
    void line(double x, double y) => path.lineTo(x * s, y * s);
    void curve(double cx, double cy, double x, double y) =>
        path.quadraticBezierTo(cx * s, cy * s, x * s, y * s);

    // Их бие (дугуйны хэсэгт зайтай)
    move(16.5, 23);
    line(4, 23);
    line(3, 17);
    curve(3, 13.5, 8, 13);
    line(27, 11.5);
    line(39, 3.5);
    line(67, 3.5);
    line(80, 11.5);
    line(93, 13.5);
    curve(97, 14.5, 97, 18);
    line(96, 23);
    line(83.5, 23);
    move(69.5, 23);
    line(30.5, 23);

    // Цонх
    move(34, 10.5);
    line(41.5, 5.5);
    line(64, 5.5);
    line(72, 10.5);
    path.close();
    canvas.drawPath(path, paint);

    canvas.drawCircle(p(23.5, 23), 6 * s, paint);
    canvas.drawCircle(p(76.5, 23), 6 * s, paint);
  }

  @override
  bool shouldRepaint(_CarOutlinePainter old) => old.color != color;
}

/// Өнгөт дэвсгэртэй машины зураг (зургийн оронд).
class CarThumb extends StatelessWidget {
  final Color tint;
  final double? width;
  final double height;
  final double carWidth;
  final BorderRadius radius;

  const CarThumb({
    super.key,
    required this.tint,
    this.width,
    required this.height,
    this.carWidth = 120,
    this.radius = const BorderRadius.all(Radius.circular(18)),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(color: tint, borderRadius: radius),
      alignment: Alignment.center,
      child: CarOutline(width: carWidth),
    );
  }
}

/// Хүрээтэй, дугуй булантай дүрс товч.
class SquareIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final double size;
  final Color background;
  final Color iconColor;
  final bool bordered;
  final bool dot;

  const SquareIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.size = 48,
    this.background = AppPalette.surface,
    this.iconColor = AppPalette.ink,
    this.bordered = true,
    this.dot = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(size * 0.32),
        side: bordered
            ? const BorderSide(color: AppPalette.border)
            : BorderSide.none,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          width: size,
          height: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(icon, color: iconColor, size: size * 0.46),
              if (dot)
                Positioned(
                  top: size * 0.2,
                  right: size * 0.24,
                  child: Container(
                    width: 9,
                    height: 9,
                    decoration: const BoxDecoration(
                      color: AppPalette.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Цагаан, дугуй булантай карт.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final double radius;
  final Color color;

  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.onTap,
    this.radius = 24,
    this.color = AppPalette.surface,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(radius),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

/// Жижиг шошго ("Шалгагдсан", "Лизинг боломжтой").
class Tag extends StatelessWidget {
  final String label;
  final Color background;
  final Color foreground;
  final IconData? icon;

  const Tag({
    super.key,
    required this.label,
    this.background = AppPalette.accent,
    this.foreground = AppPalette.ink,
    this.icon,
  });

  const Tag.verified({super.key, this.label = 'Оношилгоотой'})
    : background = AppPalette.greenTint,
      foreground = AppPalette.green,
      icon = Icons.verified_user_outlined;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: foreground),
            const SizedBox(width: 5),
          ],
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: foreground,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Хайлтын талбар.
class SearchField extends StatelessWidget {
  final String hint;
  final TextEditingController? controller;
  final ValueChanged<String>? onSubmitted;
  final Color fill;
  final bool bordered;

  const SearchField({
    super.key,
    required this.hint,
    this.controller,
    this.onSubmitted,
    this.fill = AppPalette.surface,
    this.bordered = true,
  });

  @override
  Widget build(BuildContext context) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: bordered
          ? const BorderSide(color: AppPalette.border)
          : BorderSide.none,
    );
    return TextField(
      controller: controller,
      onSubmitted: onSubmitted,
      textInputAction: TextInputAction.search,
      style: const TextStyle(fontSize: 16),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppPalette.muted, fontSize: 16),
        prefixIcon: const Padding(
          padding: EdgeInsets.only(left: 16, right: 8),
          child: Icon(Icons.search, color: AppPalette.muted),
        ),
        filled: true,
        fillColor: fill,
        contentPadding: const EdgeInsets.symmetric(vertical: 18),
        border: border,
        enabledBorder: border,
        focusedBorder: border.copyWith(
          borderSide: const BorderSide(color: AppPalette.primary, width: 1.5),
        ),
      ),
    );
  }
}

/// Дугуй булантай чип (сонгосон үед хар).
class PillChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;

  const PillChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppPalette.ink : AppPalette.surface,
      shape: StadiumBorder(
        side: BorderSide(color: selected ? AppPalette.ink : AppPalette.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : AppPalette.ink,
            ),
          ),
        ),
      ),
    );
  }
}

/// Саарал дэвсгэртэй сегмент сонголт.
class SegmentedPicker extends StatelessWidget {
  final List<String> options;
  final int selected;
  final ValueChanged<int> onChanged;
  final double height;

  /// true бол бүх өргөнийг тэнцүү хуваана.
  final bool expand;

  const SegmentedPicker({
    super.key,
    required this.options,
    required this.selected,
    required this.onChanged,
    this.height = 52,
    this.expand = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppPalette.chipGrey,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
        children: [
          for (var i = 0; i < options.length; i++)
            Flexible(
              flex: expand ? 1 : 0,
              fit: FlexFit.tight,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => onChanged(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: i == selected ? AppPalette.surface : null,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    options[i],
                    maxLines: 1,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
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

/// Үндсэн цэнхэр товч.
class PrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final double height;

  const PrimaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.height = 60,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: AppPalette.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 20),
              const SizedBox(width: 10),
            ],
            Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
          ],
        ),
      ),
    );
  }
}

/// Хар хүрээтэй цагаан товч.
class OutlineButton extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final double height;

  const OutlineButton({
    super.key,
    this.label,
    this.icon,
    this.onPressed,
    this.height = 60,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppPalette.ink,
          backgroundColor: AppPalette.surface,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          side: const BorderSide(color: AppPalette.ink, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) Icon(icon, size: 22),
            if (icon != null && label != null) const SizedBox(width: 8),
            if (label != null) Text(label!),
          ],
        ),
      ),
    );
  }
}

/// Хэсгийн гарчиг + баруун талын холбоос.
class SectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;

  const SectionHeader({
    super.key,
    required this.title,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          ),
        ),
        if (action != null)
          GestureDetector(
            onTap: onAction,
            child: Text(
              action!,
              style: const TextStyle(
                color: AppPalette.primary,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
      ],
    );
  }
}

/// Үнийн цэнхэр текст.
class PriceText extends StatelessWidget {
  final String price;
  final double size;
  final Color color;

  const PriceText(
    this.price, {
    super.key,
    this.size = 20,
    this.color = AppPalette.primary,
  });

  @override
  Widget build(BuildContext context) => Text(
    price,
    style: TextStyle(
      color: color,
      fontSize: size,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.3,
    ),
  );
}
