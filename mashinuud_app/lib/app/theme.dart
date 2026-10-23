import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Cardealer design tokens — the same values as the website (web/src/app/globals.css).
class AppPalette {
  static const Color background = Color(0xFFF6F7F9);
  static const Color foreground = Color(0xFF16181D);
  static const Color card = Color(0xFFFFFFFF);

  static const Color primary = Color(0xFFF26A1B);
  static const Color primaryHover = Color(0xFFDC5810);
  static const Color primarySoft = Color(0xFFFFF1E8);

  static const Color dark = Color(0xFF16181D);
  static const Color dark2 = Color(0xFF2A2D35);

  static const Color amber = Color(0xFFFFB547);
  static const Color amberSoft = Color(0xFFFFF6E5);
  static const Color amberInk = Color(0xFF9A5B00);

  static const Color muted = Color(0xFFF1F3F6);
  static const Color mutedForeground = Color(0xFF6B7280);

  static const Color success = Color(0xFF12A150);
  static const Color successSoft = Color(0xFFE7F8EE);
  static const Color destructive = Color(0xFFE5484D);
  static const Color destructiveSoft = Color(0xFFFDECEC);

  static const Color border = Color(0xFFECEEF2);
  static const Color input = Color(0xFFDFE3E8);

  // Pastel wells behind car images, cycled by car id.
  static const Color tintBlue = Color(0xFFE9F5FF);
  static const Color tintPeach = Color(0xFFFFF3EA);
  static const Color tintMint = Color(0xFFEAFAF2);
  static const Color tintLavender = Color(0xFFF1EEFF);
  static const Color tintRose = Color(0xFFFFF0F1);

  static const List<Color> tints = [tintBlue, tintPeach, tintMint, tintLavender, tintRose];

  /// Stable card tint per car, like the website's image wells.
  static Color tintFor(int id) => tints[id.abs() % tints.length];
}

class AppRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
}

class AppTheme {
  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppPalette.primary,
        primary: AppPalette.primary,
        onPrimary: Colors.white,
        surface: AppPalette.card,
        onSurface: AppPalette.foreground,
        error: AppPalette.destructive,
      ),
      scaffoldBackgroundColor: AppPalette.background,
    );
    final text = GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: AppPalette.foreground,
      displayColor: AppPalette.foreground,
    );
    return base.copyWith(
      textTheme: text,
      dividerColor: AppPalette.border,
      dividerTheme: const DividerThemeData(color: AppPalette.border, space: 1, thickness: 1),
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        foregroundColor: AppPalette.foreground,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        toolbarHeight: 56,
        shape: const Border(bottom: BorderSide(color: AppPalette.border)),
        titleTextStyle: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppPalette.foreground),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        indicatorColor: AppPalette.primarySoft,
        height: 72,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (s) => GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: s.contains(WidgetState.selected) ? AppPalette.foreground : AppPalette.mutedForeground,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (s) => IconThemeData(
            size: 22,
            color: s.contains(WidgetState.selected) ? AppPalette.primary : AppPalette.mutedForeground,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        hintStyle: const TextStyle(color: AppPalette.mutedForeground, fontSize: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppPalette.input),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppPalette.input),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppPalette.primary, width: 1.5),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppPalette.background,
        surfaceTintColor: AppPalette.background,
        showDragHandle: true,
      ),
      snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
    );
  }
}

/// Condensed uppercase display type (website: Oswald `.font-display`). Callers upper-case the text.
TextStyle displayStyle(double size, {FontWeight weight = FontWeight.w700, Color color = AppPalette.foreground, double height = 1.0}) =>
    GoogleFonts.oswald(fontSize: size, fontWeight: weight, color: color, height: height, letterSpacing: 0.1);

/// Spaced-out kicker above section titles ("О Н Ц Л О Х").
TextStyle kickerStyle({Color color = AppPalette.mutedForeground}) =>
    TextStyle(fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 3.8, color: color);
