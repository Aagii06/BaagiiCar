import 'package:flutter/material.dart';

/// AutoZah дизайны өнгөний токенууд.
class AppPalette {
  static const Color primary = Color(0xFF1E4BFF);
  static const Color primaryTint = Color(0xFFE8EDFF);
  static const Color ink = Color(0xFF111317);
  static const Color inkSoft = Color(0xFF2A2D33);
  static const Color background = Color(0xFFF1F2F4);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color muted = Color(0xFF6B7078);
  static const Color border = Color(0xFFE2E4E8);
  static const Color chipGrey = Color(0xFFE4E6EA);

  static const Color accent = Color(0xFFF5B324);
  static const Color accentTint = Color(0xFFFFF1D6);
  static const Color green = Color(0xFF16803C);
  static const Color greenTint = Color(0xFFE6F4EA);
  static const Color red = Color(0xFFE5484D);
  static const Color redText = Color(0xFFB42318);
  static const Color redTint = Color(0xFFFDE8E8);
  static const Color lavenderTint = Color(0xFFEEEBF8);

  // Машины зургийн дэвсгэр өнгөнүүд
  static const Color tintBlue = Color(0xFFE6EBFF);
  static const Color tintYellow = Color(0xFFFFF1D6);
  static const Color tintGreen = Color(0xFFE8F4EC);
  static const Color tintLavender = Color(0xFFEEEBF8);
  static const Color tintPink = Color(0xFFFDE9EA);
}

class AppTheme {
  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppPalette.primary,
        primary: AppPalette.primary,
        surface: AppPalette.surface,
      ),
      scaffoldBackgroundColor: AppPalette.background,
    );
    return base.copyWith(
      textTheme: base.textTheme.apply(
        bodyColor: AppPalette.ink,
        displayColor: AppPalette.ink,
      ),
      splashFactory: InkSparkle.splashFactory,
    );
  }
}

/// Том гарчгийн текст (дизайны өргөн, тод фонт).
TextStyle displayStyle(double size, {Color color = AppPalette.ink}) =>
    TextStyle(
      fontSize: size,
      fontWeight: FontWeight.w900,
      height: 1.1,
      letterSpacing: -0.8,
      color: color,
    );
