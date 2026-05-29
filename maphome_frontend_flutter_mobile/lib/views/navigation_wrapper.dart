import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import 'home/home_screen.dart';
import 'map/map_screen.dart';
import 'post/post_room_screen.dart';
import 'dashboard/dashboard_router.dart';
import 'auth/login_screen.dart';

class NavigationWrapper extends StatefulWidget {
  const NavigationWrapper({super.key});

  @override
  State<NavigationWrapper> createState() => _NavigationWrapperState();
}

class _NavigationWrapperState extends State<NavigationWrapper> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const MapScreen(),
    const PostRoomScreen(),
    const DashboardRouter(),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : AppColors.background,
          border: Border(
            top: BorderSide(
              color: isDark ? AppColors.darkBorder : AppColors.border,
              width: 1,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: isDark
              ? AppColors.darkMutedForeground
              : AppColors.mutedForeground,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          selectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontFamily: 'Outfit',
          ),
          unselectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w500,
            fontFamily: 'Outfit',
          ),
          onTap: (index) {
            // If trying to access Post room or Dashboard without being logged in, redirect to login
            if ((index == 2 || index == 3) && !auth.isAuthenticated) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
              return;
            }
            setState(() {
              _currentIndex = index;
            });
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined, size: 24),
              activeIcon: Icon(Icons.home, size: 24),
              label: 'Trang chủ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined, size: 24),
              activeIcon: Icon(Icons.map, size: 24),
              label: 'Bản đồ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.add_circle_outline, size: 24),
              activeIcon: Icon(Icons.add_circle, size: 24),
              label: 'Đăng tin',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline, size: 24),
              activeIcon: Icon(Icons.person, size: 24),
              label: 'Cá nhân',
            ),
          ],
        ),
      ),
    );
  }
}
