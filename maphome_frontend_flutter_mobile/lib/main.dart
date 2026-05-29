import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'constants/app_colors.dart';
import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'providers/properties_provider.dart';
import 'providers/verification_provider.dart';
import 'providers/compare_provider.dart';
import 'views/navigation_wrapper.dart';

void main() async {
  // Ensure Flutter binding is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize API service (loads saved authentication token and cookies)
  await ApiService().init();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PropertiesProvider()),
        ChangeNotifierProvider(create: (_) => VerificationProvider()),
        ChangeNotifierProvider(create: (_) => CompareProvider()),
      ],
      child: MaterialApp(
        title: 'MapHome Mobile',
        debugShowCheckedModeBanner: false,

        // Modern Light Theme - Matching Web Design
        theme: ThemeData(
          useMaterial3: true,
          brightness: Brightness.light,
          primaryColor: AppColors.primary,
          scaffoldBackgroundColor: AppColors.background,
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.primary,
            brightness: Brightness.light,
            primary: AppColors.primary,
            secondary: AppColors.accent,
            error: AppColors.error,
            surface: AppColors.background,
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: AppColors.background,
            surfaceTintColor: Colors.transparent,
            elevation: 0.5,
            scrolledUnderElevation: 0.5,
            titleTextStyle: TextStyle(
              color: AppColors.foreground,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              fontFamily: 'Outfit',
            ),
            iconTheme: IconThemeData(color: AppColors.primary),
          ),
          cardTheme: CardThemeData(
            color: AppColors.card,
            elevation: 0,
            clipBehavior: Clip.hardEdge,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppColors.border, width: 1),
            ),
          ),
          filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          outlinedButtonTheme: OutlinedButtonThemeData(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(color: AppColors.border),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          textButtonTheme: TextButtonThemeData(
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: AppColors.inputBackground,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            hintStyle: const TextStyle(
              color: AppColors.mutedForeground,
              fontFamily: 'Outfit',
            ),
            labelStyle: const TextStyle(
              color: AppColors.foreground,
              fontFamily: 'Outfit',
            ),
          ),
          textTheme: const TextTheme(
            displayLarge: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: AppColors.foreground,
              fontFamily: 'Outfit',
            ),
            displayMedium: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.foreground,
              fontFamily: 'Outfit',
            ),
            titleLarge: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
              fontFamily: 'Outfit',
            ),
            titleMedium: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
              fontFamily: 'Outfit',
            ),
            bodyLarge: TextStyle(
              fontSize: 16,
              color: AppColors.foreground,
              fontFamily: 'Outfit',
            ),
            bodyMedium: TextStyle(
              fontSize: 14,
              color: AppColors.foreground,
              fontFamily: 'Outfit',
            ),
            labelSmall: TextStyle(
              fontSize: 12,
              color: AppColors.mutedForeground,
              fontFamily: 'Outfit',
            ),
          ),
          fontFamily: 'Outfit',
        ),

        // Modern Dark Theme - Matching Web Design
        darkTheme: ThemeData(
          useMaterial3: true,
          brightness: Brightness.dark,
          primaryColor: AppColors.primary,
          scaffoldBackgroundColor: AppColors.darkBackground,
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.primary,
            brightness: Brightness.dark,
            primary: AppColors.primary,
            secondary: Color.alphaBlend(
              Color(0x30FFFFFF),
              AppColors.darkSecondary,
            ),
            error: AppColors.error,
            surface: AppColors.darkBackground,
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: AppColors.darkBackground,
            surfaceTintColor: Colors.transparent,
            elevation: 0.5,
            scrolledUnderElevation: 0.5,
            titleTextStyle: TextStyle(
              color: AppColors.darkForeground,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              fontFamily: 'Outfit',
            ),
            iconTheme: IconThemeData(color: AppColors.primary),
          ),
          cardTheme: CardThemeData(
            color: AppColors.darkCard,
            elevation: 0,
            clipBehavior: Clip.hardEdge,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppColors.darkBorder, width: 1),
            ),
          ),
          filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          outlinedButtonTheme: OutlinedButtonThemeData(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(color: AppColors.darkBorder),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: AppColors.darkSecondary,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.darkBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.darkBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            hintStyle: const TextStyle(
              color: AppColors.darkMutedForeground,
              fontFamily: 'Outfit',
            ),
            labelStyle: const TextStyle(
              color: AppColors.darkForeground,
              fontFamily: 'Outfit',
            ),
          ),
          textTheme: const TextTheme(
            displayLarge: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: AppColors.darkForeground,
              fontFamily: 'Outfit',
            ),
            displayMedium: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.darkForeground,
              fontFamily: 'Outfit',
            ),
            titleLarge: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppColors.darkForeground,
              fontFamily: 'Outfit',
            ),
            titleMedium: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.darkForeground,
              fontFamily: 'Outfit',
            ),
            bodyLarge: TextStyle(
              fontSize: 16,
              color: AppColors.darkForeground,
              fontFamily: 'Outfit',
            ),
            bodyMedium: TextStyle(
              fontSize: 14,
              color: AppColors.darkForeground,
              fontFamily: 'Outfit',
            ),
            labelSmall: TextStyle(
              fontSize: 12,
              color: AppColors.darkMutedForeground,
              fontFamily: 'Outfit',
            ),
          ),
          fontFamily: 'Outfit',
        ),

        themeMode: ThemeMode.system, // Auto detect system theme
        home: const NavigationWrapper(),
      ),
    );
  }
}
