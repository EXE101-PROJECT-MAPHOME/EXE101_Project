import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import 'user_dashboard.dart';
import 'landlord_dashboard.dart';
import 'admin_dashboard.dart';
import '../auth/login_screen.dart';

class DashboardRouter extends StatelessWidget {
  const DashboardRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    if (!auth.isAuthenticated) {
      return const LoginScreen();
    }

    final role = auth.user?.role ?? 'user';

    switch (role) {
      case 'admin':
        return const AdminDashboard();
      case 'landlord':
        return const LandlordDashboard();
      case 'user':
      default:
        return const UserDashboard();
    }
  }
}
