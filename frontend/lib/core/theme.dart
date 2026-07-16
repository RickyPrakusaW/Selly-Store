import 'package:flutter/material.dart';

TextStyle _playfair({
  double? fontSize,
  double? height,
  FontWeight? fontWeight,
  Color? color,
  double? letterSpacing,
}) {
  return TextStyle(
    fontFamily: 'PlayfairDisplay',
    fontSize: fontSize,
    height: height,
    fontWeight: fontWeight,
    color: color,
    letterSpacing: letterSpacing,
  );
}

TextStyle _jakarta({
  double? fontSize,
  double? height,
  FontWeight? fontWeight,
  Color? color,
  double? letterSpacing,
}) {
  return TextStyle(
    fontFamily: 'PlusJakartaSans',
    fontSize: fontSize,
    height: height,
    fontWeight: fontWeight,
    color: color,
    letterSpacing: letterSpacing,
  );
}

abstract final class AppColors {
  static const primaryPink = Color(0xFFF472B6);
  static const softPink = Color(0xFFFBB6CE);
  static const blushRose = Color(0xFFFCE7F3);
  static const deepRose = Color(0xFFDB2777);

  static const pureWhite = Color(0xFFFFFFFF);
  static const offWhite = Color(0xFFFFF5F7);
  static const inputBackground = Color(0xFFF9FAFB);
  static const lightGray = Color(0xFFF3F4F6);
  static const mediumGray = Color(0xFF9CA3AF);
  static const darkGray = Color(0xFF374151);
  static const charcoal = Color(0xFF1F2937);

  static const petalPeach = Color(0xFFFDBA74);
  static const leafGreen = Color(0xFF86EFAC);
  static const lavenderMist = Color(0xFFDDD6FE);
  static const creamGold = Color(0xFFFDE68A);

  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF60A5FA);

  static const readyStockBackground = Color(0xFFDCFCE7);
  static const readyStockText = Color(0xFF16A34A);
  static const preOrderBackground = Color(0xFFFEF3C7);
  static const preOrderText = Color(0xFFD97706);
}

abstract final class AppTheme {
  static ThemeData get light {
    final baseTheme = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primaryPink,
        onPrimary: AppColors.pureWhite,
        secondary: AppColors.deepRose,
        onSecondary: AppColors.pureWhite,
        surface: AppColors.pureWhite,
        onSurface: AppColors.charcoal,
        error: AppColors.error,
      ),
      scaffoldBackgroundColor: AppColors.pureWhite,
    );

    final bodyTextTheme = baseTheme.textTheme.apply(
      fontFamily: 'PlusJakartaSans',
      bodyColor: AppColors.darkGray,
      displayColor: AppColors.charcoal,
    );

    final textTheme = bodyTextTheme.copyWith(
      displayLarge: _playfair(
        fontSize: 36,
        height: 44 / 36,
        fontWeight: FontWeight.w700,
        color: AppColors.charcoal,
      ),
      displayMedium: _playfair(
        fontSize: 28,
        height: 36 / 28,
        fontWeight: FontWeight.w600,
        color: AppColors.charcoal,
      ),
      displaySmall: _playfair(
        fontSize: 24,
        height: 32 / 24,
        fontWeight: FontWeight.w600,
        color: AppColors.charcoal,
      ),
      headlineLarge: _playfair(
        fontSize: 24,
        height: 32 / 24,
        fontWeight: FontWeight.w700,
        color: AppColors.charcoal,
      ),
      headlineMedium: _playfair(
        fontSize: 20,
        height: 28 / 20,
        fontWeight: FontWeight.w600,
        color: AppColors.charcoal,
      ),
      headlineSmall: _playfair(
        fontSize: 16,
        height: 24 / 16,
        fontWeight: FontWeight.w600,
        color: AppColors.charcoal,
      ),
      titleLarge: _jakarta(
        fontSize: 20,
        height: 28 / 20,
        fontWeight: FontWeight.w700,
        color: AppColors.charcoal,
      ),
      titleMedium: _jakarta(
        fontSize: 16,
        height: 24 / 16,
        fontWeight: FontWeight.w600,
        color: AppColors.charcoal,
      ),
      titleSmall: _jakarta(
        fontSize: 14,
        height: 22 / 14,
        fontWeight: FontWeight.w600,
        color: AppColors.charcoal,
      ),
      bodyLarge: _jakarta(
        fontSize: 16,
        height: 26 / 16,
        fontWeight: FontWeight.w400,
        color: AppColors.darkGray,
      ),
      bodyMedium: _jakarta(
        fontSize: 14,
        height: 22 / 14,
        fontWeight: FontWeight.w400,
        color: AppColors.darkGray,
      ),
      bodySmall: _jakarta(
        fontSize: 12,
        height: 18 / 12,
        fontWeight: FontWeight.w400,
        color: AppColors.mediumGray,
      ),
      labelLarge: _jakarta(
        fontSize: 14,
        height: 20 / 14,
        fontWeight: FontWeight.w600,
        letterSpacing: 0,
      ),
      labelMedium: _jakarta(
        fontSize: 12,
        height: 16 / 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0,
      ),
      labelSmall: _jakarta(
        fontSize: 12,
        height: 16 / 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0,
      ),
    );

    return baseTheme.copyWith(
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.pureWhite,
        foregroundColor: AppColors.charcoal,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.headlineMedium?.copyWith(
          color: AppColors.deepRose,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.pureWhite,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.lightGray),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primaryPink,
          foregroundColor: AppColors.pureWhite,
          minimumSize: const Size(44, 44),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: const StadiumBorder(),
          textStyle: textTheme.labelLarge,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryPink,
          foregroundColor: AppColors.pureWhite,
          elevation: 0,
          minimumSize: const Size(44, 48),
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
          shape: const StadiumBorder(),
          textStyle: textTheme.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.deepRose,
          minimumSize: const Size(44, 44),
          textStyle: textTheme.labelLarge,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.blushRose,
        selectedColor: AppColors.primaryPink,
        side: BorderSide.none,
        shape: const StadiumBorder(),
        labelStyle: textTheme.labelMedium?.copyWith(color: AppColors.deepRose),
        secondaryLabelStyle: textTheme.labelMedium?.copyWith(
          color: AppColors.pureWhite,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.inputBackground,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.softPink, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.softPink, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primaryPink, width: 2),
        ),
        labelStyle: textTheme.bodyMedium,
        hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
      ),
      dividerColor: AppColors.lightGray,
      iconTheme: const IconThemeData(color: AppColors.darkGray, size: 24),
    );
  }
}
