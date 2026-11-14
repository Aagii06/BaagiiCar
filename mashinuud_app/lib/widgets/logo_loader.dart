import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';

/// Full-screen loader (admin SplashScreen.tsx): the logo in a white disc, an orange arc spinning around it,
/// a faint amber arc turning the other way, and the logo gently breathing.
class FullScreenLoader extends StatelessWidget {
  const FullScreenLoader({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(backgroundColor: AppPalette.background, body: Center(child: LogoLoader()));
}

class LogoLoader extends StatefulWidget {
  final double size;
  const LogoLoader({super.key, this.size = 128});
  @override
  State<LogoLoader> createState() => _LogoLoaderState();
}

class _LogoLoaderState extends State<LogoLoader> with TickerProviderStateMixin {
  late final _spin = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))..repeat();
  late final _reverse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))..repeat();
  late final _breathe = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);

  @override
  void dispose() {
    _spin.dispose();
    _reverse.dispose();
    _breathe.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.size;
    final reduce = MediaQuery.of(context).disableAnimations;
    return Semantics(
      label: 'Ачаалж байна',
      child: SizedBox(
        width: s,
        height: s,
        child: Stack(alignment: Alignment.center, children: [
          RotationTransition(turns: _spin, child: CustomPaint(size: Size.square(s), painter: _OuterArc())),
          RotationTransition(turns: ReverseAnimation(_reverse), child: CustomPaint(size: Size.square(s), painter: _InnerArc())),
          Container(
            width: s - 36 * s / 128,
            height: s - 36 * s / 128,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppPalette.card,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: AppPalette.primary.withValues(alpha: 0.35), blurRadius: 30, spreadRadius: -8, offset: const Offset(0, 8))],
            ),
            child: AnimatedBuilder(
              animation: _breathe,
              builder: (context, child) => Transform.scale(
                scale: reduce ? 1 : 1 - 0.06 * Curves.easeInOut.transform(_breathe.value),
                child: Opacity(opacity: reduce ? 1 : 1 - 0.15 * _breathe.value, child: child),
              ),
              child: FractionallySizedBox(widthFactor: 0.7, child: Image.asset('assets/logo.png', fit: BoxFit.contain)),
            ),
          ),
        ]),
      ),
    );
  }
}

/// Grey track (r 60 of 128) and an orange arc fading in along its length.
class _OuterArc extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final k = size.width / 128;
    final rect = Rect.fromCircle(center: size.center(Offset.zero), radius: 60 * k);
    canvas.drawArc(rect, 0, 2 * math.pi, false, Paint()
      ..color = AppPalette.border
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4 * k);
    const sweep = 2 * math.pi * 120 / 377;
    canvas.drawArc(
      rect,
      -math.pi / 2,
      sweep,
      false,
      Paint()
        ..shader = SweepGradient(
          startAngle: 0,
          endAngle: sweep,
          colors: [AppPalette.primary.withValues(alpha: 0), AppPalette.primary],
          transform: const GradientRotation(-math.pi / 2),
        ).createShader(rect)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4 * k
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_OuterArc oldDelegate) => false;
}

/// Faint amber arc (r 52) turning the other way.
class _InnerArc extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final k = size.width / 128;
    final rect = Rect.fromCircle(center: size.center(Offset.zero), radius: 52 * k);
    canvas.drawArc(rect, -math.pi / 2, 2 * math.pi * 50 / 327, false, Paint()
      ..color = AppPalette.amber.withValues(alpha: 0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2 * k
      ..strokeCap = StrokeCap.round);
  }

  @override
  bool shouldRepaint(_InnerArc oldDelegate) => false;
}
