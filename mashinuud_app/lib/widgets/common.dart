import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';

/// Loads [fetch] and rebuilds with the result; [fetchKey] changing refetches (stale data stays on screen meanwhile).
class Loader<T> extends StatefulWidget {
  final Future<T> Function() fetch;
  final Object? fetchKey;
  final Widget Function(BuildContext context, T data, bool refreshing) builder;
  final Widget? loading;
  final Widget Function(BuildContext context, Object error, VoidCallback retry)? error;

  const Loader({super.key, required this.fetch, required this.builder, this.fetchKey, this.loading, this.error});

  @override
  State<Loader<T>> createState() => LoaderState<T>();
}

class LoaderState<T> extends State<Loader<T>> {
  T? _data;
  bool _hasData = false;
  Object? _error;
  bool _loading = true;
  int _request = 0;

  @override
  void initState() {
    super.initState();
    reload();
  }

  @override
  void didUpdateWidget(covariant Loader<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.fetchKey != widget.fetchKey) reload();
  }

  Future<void> reload() async {
    final id = ++_request;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await widget.fetch();
      if (!mounted || id != _request) return;
      setState(() {
        _data = data;
        _hasData = true;
        _loading = false;
      });
    } catch (e) {
      if (!mounted || id != _request) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return widget.error?.call(context, _error!, reload) ?? ErrorView(message: '$_error', onRetry: reload);
    }
    if (!_hasData) return widget.loading ?? const PageSkeleton();
    return widget.builder(context, _data as T, _loading);
  }
}

/// Fades its child in and out while something loads (web `animate-pulse`).
class Pulse extends StatefulWidget {
  final Widget child;
  const Pulse({super.key, required this.child});
  @override
  State<Pulse> createState() => _PulseState();
}

class _PulseState extends State<Pulse> with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(opacity: Tween(begin: 1.0, end: 0.4).animate(_controller), child: widget.child);
}

/// Left-aligned bar taking [widthFactor] of the row (a line of text in a skeleton).
class SkeletonLine extends StatelessWidget {
  final double widthFactor;
  final double height;
  const SkeletonLine({super.key, this.widthFactor = 1, this.height = 13});
  @override
  Widget build(BuildContext context) =>
      FractionallySizedBox(alignment: Alignment.centerLeft, widthFactor: widthFactor, child: SkeletonBox(height: height));
}

/// Panels of text lines, for a page whose shape isn't known yet (web `PageSkeleton`).
class PageSkeleton extends StatelessWidget {
  final int count;
  final EdgeInsetsGeometry padding;
  const PageSkeleton({super.key, this.count = 3, this.padding = const EdgeInsets.all(16)});
  @override
  Widget build(BuildContext context) => Pulse(
        child: Padding(
          padding: padding,
          child: Column(children: [
            for (var i = 0; i < count; i++)
              Padding(
                padding: EdgeInsets.only(bottom: i < count - 1 ? 12 : 0),
                child: const Panel(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    SkeletonLine(widthFactor: 0.35, height: 18),
                    SizedBox(height: 14),
                    SkeletonLine(),
                    SizedBox(height: 10),
                    SkeletonLine(widthFactor: 0.8),
                  ]),
                ),
              ),
          ]),
        ),
      );
}

/// List rows: a car thumb (or round avatar) and two lines (web `RowsSkeleton`).
class RowsSkeleton extends StatelessWidget {
  final int count;
  final bool avatar;
  final double thumbWidth;
  final double thumbHeight;
  final EdgeInsetsGeometry rowPadding;
  final bool dividers;
  const RowsSkeleton({
    super.key,
    this.count = 5,
    this.avatar = false,
    this.thumbWidth = 64,
    this.thumbHeight = 48,
    this.rowPadding = const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    this.dividers = false,
  });
  @override
  Widget build(BuildContext context) => Pulse(
        child: Column(children: [
          for (var i = 0; i < count; i++) ...[
            if (dividers && i > 0) const Divider(height: 1),
            Padding(
              padding: rowPadding,
              child: Row(children: [
                avatar
                    ? Container(width: thumbHeight, height: thumbHeight, decoration: const BoxDecoration(color: AppPalette.muted, shape: BoxShape.circle))
                    : SkeletonBox(width: thumbWidth, height: thumbHeight, radius: AppRadius.sm),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    SkeletonLine(widthFactor: const [0.6, 0.5, 0.7][i % 3], height: 14),
                    const SizedBox(height: 8),
                    const SkeletonLine(widthFactor: 0.35, height: 12),
                  ]),
                ),
              ]),
            ),
          ],
        ]),
      );
}

class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  const ErrorView({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) => Panel(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          children: [
            const Icon(Icons.error_outline_rounded, size: 32, color: AppPalette.destructive),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
            if (onRetry != null) ...[
              const SizedBox(height: 14),
              OutlineAction(label: 'Дахин оролдох', onTap: onRetry!),
            ],
          ],
        ),
      );
}

class EmptyView extends StatelessWidget {
  final String title;
  final String? description;
  final Widget? action;
  final IconData icon;
  const EmptyView({super.key, required this.title, this.description, this.action, this.icon = Icons.directions_car_outlined});

  @override
  Widget build(BuildContext context) => Panel(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(color: AppPalette.muted, shape: BoxShape.circle),
              child: Icon(icon, color: AppPalette.mutedForeground),
            ),
            const SizedBox(height: 14),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            if (description != null) ...[
              const SizedBox(height: 6),
              Text(description!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
            ],
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      );
}

/// White rounded card (web: `rounded-2xl bg-card`).
class Panel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final double radius;
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(20), this.color = AppPalette.card, this.radius = AppRadius.xl});

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(radius)),
        child: child,
      );
}

/// Light word + bold word heading, with an optional kicker and trailing action (web `SectionTitle`).
class SectionTitle extends StatelessWidget {
  final String? kicker;
  final String? light;
  final String bold;
  final Widget? action;
  const SectionTitle({super.key, this.kicker, this.light, required this.bold, this.action});

  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (kicker != null) ...[Text(kicker!.toUpperCase(), style: kickerStyle()), const SizedBox(height: 8)],
                Text.rich(TextSpan(children: [
                  if (light != null) TextSpan(text: '${light!.toUpperCase()} ', style: displayStyle(24, weight: FontWeight.w300)),
                  TextSpan(text: bold.toUpperCase(), style: displayStyle(24)),
                ])),
              ],
            ),
          ),
          ?action,
        ],
      );
}

/// "Бүгдийг үзэх →" link beside a section title.
class ViewAll extends StatelessWidget {
  final VoidCallback onTap;
  const ViewAll({super.key, required this.onTap});
  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text('БҮГД', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1)),
            SizedBox(width: 4),
            Icon(Icons.arrow_forward_rounded, size: 16),
          ]),
        ),
      );
}

/// "No image" picture (our logo in gray), cut three ways: no file uploaded, an empty path, or a file that fails to load.
const noImage = 'assets/no-image.png';
const noImageSmall = 'assets/no-image-sm.png';
const noImageWide = 'assets/no-image-wide.png';

/// Small boxes get the tight cut (the logo fills it), wide ones the 4:3 cut, the rest the square one.
String noImageFor(double width, double height) {
  if (!width.isFinite || !height.isFinite) return noImage;
  if (width <= 96 && height <= 96) return noImageSmall;
  if (height > 0 && width / height >= 1.2) return noImageWide;
  return noImage;
}

/// The [noImage] picture in the cut that fits the space it gets.
class NoImage extends StatelessWidget {
  final BoxFit fit;
  const NoImage({super.key, this.fit = BoxFit.contain});

  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (context, box) => Image.asset(noImageFor(box.maxWidth, box.maxHeight), fit: fit, width: double.infinity, height: double.infinity),
      );
}

/// Network photo on a tinted background, with the [noImage] picture when there is none.
class NetImage extends StatelessWidget {
  final String? url;
  final BoxFit fit;
  final Color background;
  const NetImage(this.url, {super.key, this.fit = BoxFit.cover, this.background = AppPalette.muted});

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(color: background, child: const NoImage());
    if (url == null) return placeholder;
    return Image.network(
      url!,
      fit: fit,
      gaplessPlayback: true,
      frameBuilder: (_, child, frame, sync) => sync || frame != null ? Container(color: background, child: child) : Container(color: background),
      errorBuilder: (_, _, _) => placeholder,
    );
  }
}

/// Filled orange button (web: `rounded-xl bg-primary font-bold text-white`).
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool busy;
  final double height;
  const PrimaryButton({super.key, required this.label, this.onTap, this.icon, this.busy = false, this.height = 48});

  @override
  Widget build(BuildContext context) => SizedBox(
        height: height,
        width: double.infinity,
        child: FilledButton(
          onPressed: busy ? null : onTap,
          style: FilledButton.styleFrom(
            backgroundColor: AppPalette.primary,
            disabledBackgroundColor: AppPalette.primary.withValues(alpha: 0.55),
            foregroundColor: Colors.white,
            disabledForegroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          child: busy
              ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
              : Row(mainAxisSize: MainAxisSize.min, children: [
                  if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
                  Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
                ]),
        ),
      );
}

class OutlineAction extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const OutlineAction({super.key, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) => OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppPalette.foreground,
          side: const BorderSide(color: AppPalette.foreground, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        ),
        child: Text(label),
      );
}

/// Square icon button with a hairline border (card action row).
class SquareIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final String tooltip;
  final double size;
  final Color? color;
  final Color? background;
  final Color? borderColor;
  const SquareIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    required this.tooltip,
    this.size = 40,
    this.color,
    this.background,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) => Tooltip(
        message: tooltip,
        child: Material(
          color: background ?? Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            side: BorderSide(color: borderColor ?? AppPalette.input, width: 1.5),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: SizedBox.square(
              dimension: size,
              child: Icon(icon, size: 19, color: onTap == null ? AppPalette.mutedForeground.withValues(alpha: 0.5) : (color ?? AppPalette.foreground)),
            ),
          ),
        ),
      );
}

/// Small pill label ("Онцлох", "Зарагдсан"…).
class Pill extends StatelessWidget {
  final String text;
  final Color background;
  final Color color;
  final IconData? icon;
  const Pill(this.text, {super.key, required this.background, required this.color, this.icon});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(99)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 13, color: color), const SizedBox(width: 4)],
          Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
        ]),
      );
}

/// Grey block for skeletons; wrap a group of them in [Pulse]. Use [AppPalette.card] on the page background.
class SkeletonBox extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;
  final Color color;
  const SkeletonBox({super.key, this.width, required this.height, this.radius = 6, this.color = AppPalette.muted});
  @override
  Widget build(BuildContext context) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(radius)),
      );
}

void showToast(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message), duration: const Duration(seconds: 2)));
}
