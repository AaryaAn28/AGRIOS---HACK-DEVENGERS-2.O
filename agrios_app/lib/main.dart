import 'package:flutter/material.dart';
import 'constants/app_colors.dart';
import 'services/auth_service.dart';
import 'screens/landing/booking_landing_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/dashboard/operator_dashboard_screen.dart';
import 'screens/dashboard/farmer_dashboard_screen.dart';
import 'screens/dashboard/agronomist_dashboard_screen.dart';
import 'screens/dashboard/government_dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AgriosApp());
}

class AgriosApp extends StatelessWidget {
  const AgriosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AGRIOS Precision OS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.primaryLight,
          background: AppColors.background,
          surface: AppColors.surface,
        ),
        scaffoldBackgroundColor: AppColors.background,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
        ),
        cardTheme: CardThemeData(
          color: AppColors.surface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.cardBorder),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 1,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        fontFamily: 'Roboto',
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();
    return AnimatedBuilder(
      animation: auth,
      builder: (context, _) {
        if (!auth.isAuthenticated) {
          return const BookingLandingScreen();
        }

        final role = auth.currentUser?.role.toLowerCase() ?? 'worker';
        switch (role) {
          case 'agronomist':
            return const AgronomistDashboardScreen();
          case 'farmer':
            return const FarmerDashboardScreen();
          case 'government':
            return const GovernmentDashboardScreen();
          case 'worker':
          default:
            return const OperatorDashboardScreen();
        }
      },
    );
  }
}
