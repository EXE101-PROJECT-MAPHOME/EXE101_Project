import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/properties_provider.dart';
import '../../widgets/custom_card.dart';

class UserDashboard extends StatefulWidget {
  const UserDashboard({super.key});

  @override
  State<UserDashboard> createState() => _UserDashboardState();
}

class _UserDashboardState extends State<UserDashboard> {
  void _showChangePasswordDialog(BuildContext context, bool isDark) {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: isDark ? AppColors.darkCard : Colors.white,
          title: Text(
            'Đổi mật khẩu',
            style: TextStyle(color: isDark ? AppColors.darkForeground : AppColors.primary),
          ),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: currentPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Mật khẩu hiện tại'),
                  validator: (val) => val == null || val.isEmpty ? 'Nhập mật khẩu hiện tại' : null,
                ),
                TextFormField(
                  controller: newPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Mật khẩu mới'),
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'Nhập mật khẩu mới';
                    if (val.length < 8) return 'Tối thiểu 8 ký tự';
                    return null;
                  },
                ),
                TextFormField(
                  controller: confirmPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Xác nhận mật khẩu mới'),
                  validator: (val) {
                    if (val != newPasswordController.text) return 'Mật khẩu không khớp';
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy', style: TextStyle(color: AppColors.mutedForeground)),
            ),
            ElevatedButton(
              onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                final auth = Provider.of<AuthProvider>(context, listen: false);
                final res = await auth.changePassword(
                  currentPasswordController.text,
                  newPasswordController.text,
                );
                if (context.mounted) {
                  Navigator.pop(context);
                  if (res['success']) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(res['message'] ?? 'Thay đổi thất bại'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Xác nhận'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final propertiesProvider = Provider.of<PropertiesProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final favoriteList = propertiesProvider.favoriteProperties;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('Trang cá nhân', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
        foregroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.error),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.border),
              ),
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 36,
                    backgroundColor: AppColors.info,
                    child: Icon(Icons.person, size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    auth.user?.fullName ?? auth.user?.username ?? '',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkForeground : AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Vai trò: Người tìm phòng',
                    style: TextStyle(fontSize: 13, color: AppColors.mutedForeground),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Email: ${auth.user?.email}',
                    style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () => _showChangePasswordDialog(context, isDark),
                    icon: const Icon(Icons.lock_outline, size: 16),
                    label: const Text('Đổi mật khẩu'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
                      side: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.border),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Favorite Properties Title
            Text(
              'Danh sách phòng đã lưu (${favoriteList.length})',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkForeground : AppColors.primary,
              ),
            ),
            const SizedBox(height: 12),

            favoriteList.isEmpty
                ? Container(
                    padding: const EdgeInsets.all(40),
                    alignment: Alignment.center,
                    child: const Column(
                      children: [
                        Icon(Icons.favorite_border, size: 48, color: AppColors.mutedForeground),
                        SizedBox(height: 12),
                        Text(
                          'Chưa lưu phòng trọ nào.',
                          style: TextStyle(color: AppColors.mutedForeground),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: favoriteList.length,
                    itemBuilder: (context, index) {
                      return CustomCard(
                        property: favoriteList[index],
                        isHorizontal: true,
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }
}
