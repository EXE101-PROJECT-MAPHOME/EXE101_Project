import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Design tokens matching the web MapHome design system
class DesignTokens {
  // Spacing / Padding
  static const double spacing2 = 2;
  static const double spacing4 = 4;
  static const double spacing8 = 8;
  static const double spacing12 = 12;
  static const double spacing16 = 16;
  static const double spacing20 = 20;
  static const double spacing24 = 24;
  static const double spacing32 = 32;

  // Border Radius
  static const double radiusSm = 8;
  static const double radiusMd = 12;
  static const double radiusLg = 16;
  static const double radiusXl = 20;
  static const double radius2xl = 24;

  // Font Sizes
  static const double fontXs = 12;
  static const double fontSm = 13;
  static const double fontBase = 14;
  static const double fontLg = 15;
  static const double fontXl = 16;
  static const double font2xl = 18;
  static const double font3xl = 20;
  static const double font4xl = 24;
  static const double font5xl = 28;
  static const double font6xl = 32;

  // Shadow
  static final BoxShadow shadowSm = BoxShadow(
    color: Colors.black.withOpacity(0.05),
    blurRadius: 4,
    offset: const Offset(0, 1),
  );

  static final BoxShadow shadowMd = BoxShadow(
    color: Colors.black.withOpacity(0.08),
    blurRadius: 8,
    offset: const Offset(0, 2),
  );

  static final BoxShadow shadowLg = BoxShadow(
    color: Colors.black.withOpacity(0.1),
    blurRadius: 12,
    offset: const Offset(0, 4),
  );

  static final List<BoxShadow> shadowButtonHover = [
    BoxShadow(
      color: AppColors.primary.withOpacity(0.3),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  // Gradients
  static const LinearGradient gradientPrimary = LinearGradient(
    colors: [AppColors.primary, Color(0xFF16A34A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient gradientSuccess = LinearGradient(
    colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Input Decoration
  static InputDecoration buildInputDecoration({
    required String hintText,
    required BuildContext context,
    IconData? prefixIcon,
    Widget? suffixIcon,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InputDecoration(
      hintText: hintText,
      hintStyle: TextStyle(
        color: isDark
            ? AppColors.darkMutedForeground
            : AppColors.mutedForeground,
        fontSize: fontBase,
      ),
      filled: true,
      fillColor: isDark ? AppColors.darkSecondary : AppColors.inputBackground,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: BorderSide(
          color: isDark ? AppColors.darkBorder : AppColors.border,
          width: 1,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: BorderSide(
          color: isDark ? AppColors.darkBorder : AppColors.border,
          width: 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: spacing16,
        vertical: spacing14,
      ),
      prefixIcon: prefixIcon != null
          ? Icon(
              prefixIcon,
              color: isDark
                  ? AppColors.darkMutedForeground
                  : AppColors.mutedForeground,
            )
          : null,
      suffixIcon: suffixIcon,
    );
  }

  // Container Styles
  static BoxDecoration containerBorder({
    required BuildContext context,
    Color? backgroundColor,
    bool hasShadow = false,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BoxDecoration(
      color: backgroundColor ?? (isDark ? AppColors.darkCard : AppColors.card),
      borderRadius: BorderRadius.circular(radiusMd),
      border: Border.all(
        color: isDark ? AppColors.darkBorder : AppColors.border,
        width: 1,
      ),
      boxShadow: hasShadow ? [shadowMd] : null,
    );
  }

  // Card Decoration for property cards
  static BoxDecoration cardDecoration({
    required BuildContext context,
    bool isHorizontal = false,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BoxDecoration(
      color: isDark ? AppColors.darkCard : Colors.white,
      borderRadius: BorderRadius.circular(isHorizontal ? radiusXl : radius2xl),
      border: Border.all(
        color: isDark ? AppColors.darkBorder : AppColors.border,
        width: 1,
      ),
      boxShadow: [
        BoxShadow(
          color: isDark
              ? Colors.black.withOpacity(0.2)
              : const Color(0xFFE2E8F0).withOpacity(0.3),
          blurRadius: isHorizontal ? 8 : 12,
          spreadRadius: isHorizontal ? 0 : 2,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }
}

const double spacing14 = 14;
