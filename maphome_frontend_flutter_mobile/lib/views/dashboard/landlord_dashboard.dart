import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/properties_provider.dart';
import '../../providers/verification_provider.dart';
import '../../models/property_model.dart';
import '../../models/verification_model.dart';

class LandlordDashboard extends StatefulWidget {
  const LandlordDashboard({super.key});

  @override
  State<LandlordDashboard> createState() => _LandlordDashboardState();
}

class _LandlordDashboardState extends State<LandlordDashboard> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    
    // Fetch requests on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<VerificationProvider>(context, listen: false).fetchRequests();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _formatPrice(int price) {
    if (price >= 1000000) {
      double value = price / 1000000;
      return '${value.toStringAsFixed(value == value.toInt() ? 0 : 1)} tr';
    }
    return '$price đ';
  }

  void _submitPhotos(String requestId) {
    final photoController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Nộp ảnh tự chụp phòng trọ'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Nhập đường dẫn URL ảnh của phòng trọ để Admin tiến hành phê duyệt đối chứng cấp Huy hiệu xanh.',
                style: TextStyle(fontSize: 12, color: AppColors.mutedForeground),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: photoController,
                decoration: const InputDecoration(
                  labelText: 'URL Ảnh phòng trọ',
                  hintText: 'https://images.unsplash.com/...',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () async {
                final url = photoController.text.trim();
                if (url.isEmpty) return;
                
                final verificationProvider = Provider.of<VerificationProvider>(context, listen: false);
                final success = await verificationProvider.submitUserPhotos(requestId, [url]);
                
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success ? 'Đã nộp ảnh phòng trọ thành công!' : 'Có lỗi xảy ra.'),
                      backgroundColor: success ? AppColors.success : AppColors.error,
                    ),
                  );
                }
              },
              child: const Text('Nộp ảnh'),
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
    final verificationProvider = Provider.of<VerificationProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final myProperties = propertiesProvider.getPropertiesByLandlord(auth.user?.id ?? '');
    final myRequests = verificationProvider.getRequestsByLandlord(auth.user?.id ?? '');

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('Dashboard Chủ trọ', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
        foregroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.error),
            onPressed: () => auth.logout(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: isDark ? Colors.white : AppColors.primary,
          unselectedLabelColor: AppColors.mutedForeground,
          indicatorColor: isDark ? Colors.white : AppColors.primary,
          tabs: const [
            Tab(text: 'Phòng trọ'),
            Tab(text: 'Yêu cầu xác minh'),
            Tab(text: 'Báo cáo doanh thu'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Properties List
          _buildPropertiesTab(myProperties, propertiesProvider, isDark),
          
          // Tab 2: Verification Requests
          _buildRequestsTab(myRequests, isDark),

          // Tab 3: Revenue Chart
          _buildRevenueTab(myProperties, isDark),
        ],
      ),
    );
  }

  Widget _buildPropertiesTab(List<RentalProperty> list, PropertiesProvider provider, bool isDark) {
    if (list.isEmpty) {
      return const Center(
        child: Text('Bạn chưa có tin đăng phòng trọ nào.', style: TextStyle(color: AppColors.mutedForeground)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final p = list[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          color: isDark ? AppColors.darkCard : AppColors.card,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.border),
          ),
          child: ListTile(
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.network(p.image, width: 60, height: 60, fit: BoxFit.cover),
            ),
            title: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('${_formatPrice(p.price)} - ${p.area} m²'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (p.verificationLevel == 'verified')
                  const Icon(Icons.verified, color: AppColors.success, size: 20)
                else
                  const Icon(Icons.pending_actions_outlined, color: AppColors.warning, size: 20),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: AppColors.error),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Xác nhận xóa'),
                        content: const Text('Bạn có chắc chắn muốn xóa tin đăng này không?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
                          TextButton(
                            onPressed: () {
                              provider.deleteProperty(p.id);
                              Navigator.pop(context);
                            },
                            child: const Text('Xóa', style: TextStyle(color: AppColors.error)),
                          )
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRequestsTab(List<VerificationRequest> list, bool isDark) {
    if (list.isEmpty) {
      return const Center(
        child: Text('Bạn chưa gửi yêu cầu xác minh nào.', style: TextStyle(color: AppColors.mutedForeground)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final r = list[index];
        Color statusColor = AppColors.warning;
        String statusText = 'Đang xử lý';

        switch (r.status) {
          case 'approved':
          case 'completed':
            statusColor = AppColors.success;
            statusText = 'Đã phê duyệt';
            break;
          case 'rejected':
            statusColor = AppColors.error;
            statusText = 'Từ chối';
            break;
          case 'awaiting_photos':
            statusColor = AppColors.info;
            statusText = 'Chờ nộp ảnh';
            break;
          case 'photos_submitted':
            statusColor = Colors.purple;
            statusText = 'Đã nộp ảnh';
            break;
        }

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          color: isDark ? AppColors.darkCard : AppColors.card,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.border),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        r.propertyName,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: statusColor, borderRadius: BorderRadius.circular(4)),
                      child: Text(
                        statusText,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Địa chỉ: ${r.address}', style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                const SizedBox(height: 4),
                Text('Hẹn ngày: ${r.scheduledDate} lúc ${r.scheduledTime}', style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                
                if (r.status == 'awaiting_photos') ...[
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => _submitPhotos(r.id),
                    icon: const Icon(Icons.add_a_photo, size: 16),
                    label: const Text('Nộp hình ảnh đối chứng', style: TextStyle(fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.info,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRevenueTab(List<RentalProperty> properties, bool isDark) {
    // Generate simple revenue bars based on total property price
    int totalPotentialRevenue = 0;
    for (var p in properties) {
      if (p.available) {
        totalPotentialRevenue += p.price;
      }
    }

    final formatter = NumberFormat('#,###', 'vi_VN');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Total Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF030213), Color(0xFF1E1B4B)]),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Doanh thu tối đa ước tính', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 8),
                Text(
                  '${formatter.format(totalPotentialRevenue)} đ/tháng',
                  style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text('Tổng số phòng: ${properties.length}', style: const TextStyle(color: Colors.white60, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Text(
            'Biểu đồ doanh thu dự kiến',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),

          // Simple mocked graphical chart using Row & Containers
          Container(
            height: 180,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _buildBar('T2', 0.4),
                _buildBar('T3', 0.5),
                _buildBar('T4', 0.7),
                _buildBar('T5', 0.9),
                _buildBar('T6', 1.0),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(String month, double fraction) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Container(
          height: 130 * fraction,
          width: 24,
          decoration: BoxDecoration(
            color: AppColors.info,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 8),
        Text(month, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
