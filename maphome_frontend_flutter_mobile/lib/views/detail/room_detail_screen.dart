import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:maplibre_gl/mapbox_gl.dart';
import '../../constants/app_colors.dart';
import '../../constants/goong.dart';
import '../../models/property_model.dart';
import '../../providers/properties_provider.dart';
import '../../providers/compare_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/verification_provider.dart';
import '../compare/compare_screen.dart';

class RoomDetailScreen extends StatefulWidget {
  final String propertyId;

  const RoomDetailScreen({super.key, required this.propertyId});

  @override
  State<RoomDetailScreen> createState() => _RoomDetailScreenState();
}

class _RoomDetailScreenState extends State<RoomDetailScreen> {
  bool _submittingInspection = false;
  MaplibreMapController? _mapController;

  String _formatPrice(int price) {
    if (price >= 1000000) {
      double value = price / 1000000;
      return '${value.toStringAsFixed(value == value.toInt() ? 0 : 1)} triệu/tháng';
    }
    final formatter = NumberFormat('#,###', 'vi_VN');
    return '${formatter.format(price)} đ/tháng';
  }

  void _showBookingDialog(RentalProperty property, bool isDark) {
    final dateController = TextEditingController(text: '30/05/2026');
    final timeController = TextEditingController(text: '09:00');
    final noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: isDark ? AppColors.darkCard : Colors.white,
          title: Text(
            'Đặt lịch hẹn xem phòng',
            style: TextStyle(
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: dateController,
                decoration: const InputDecoration(
                  labelText: 'Ngày hẹn',
                  suffixIcon: Icon(Icons.calendar_today),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: timeController,
                decoration: const InputDecoration(
                  labelText: 'Giờ hẹn',
                  suffixIcon: Icon(Icons.access_time),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: noteController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Lời nhắn gửi chủ trọ',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Hủy',
                style: TextStyle(color: AppColors.mutedForeground),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Yêu cầu đặt lịch đã được gửi đến chủ trọ!'),
                    backgroundColor: AppColors.success,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
              ),
              child: const Text('Gửi lịch hẹn'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _requestVerification(RentalProperty property) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập trước khi yêu cầu xác minh.'),
        ),
      );
      return;
    }

    setState(() => _submittingInspection = true);
    final verificationProvider = Provider.of<VerificationProvider>(
      context,
      listen: false,
    );

    final payload = {
      'propertyId': property.id,
      'propertyName': property.name,
      'landlordId': property.landlordId ?? auth.user?.id ?? '',
      'landlordName': property.ownerName,
      'phone': property.phone,
      'address': property.address,
      'scheduledDate': DateTime.now()
          .add(const Duration(days: 2))
          .toIso8601String()
          .split('T')[0],
      'scheduledTime': '14:00',
      'requesterType': auth.user?.role == 'landlord' ? 'landlord' : 'user',
      'requesterId': auth.user?.id ?? '',
      'requesterName': auth.user?.fullName ?? auth.user?.username ?? '',
      'requesterPhone': auth.user?.phone ?? '',
    };

    final success = await verificationProvider.addRequest(payload);
    setState(() => _submittingInspection = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã gửi yêu cầu xác minh phòng trọ thành công!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Không thể gửi yêu cầu. Phòng trọ có thể đang được xác minh rồi.',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final propertiesProvider = Provider.of<PropertiesProvider>(context);
    final compareProvider = Provider.of<CompareProvider>(context);

    // Find the property
    final property = propertiesProvider.properties.firstWhere(
      (p) => p.id == widget.propertyId,
      orElse: () => RentalProperty(
        id: '',
        name: 'Đang tải...',
        address: '',
        price: 0,
        lat: 0,
        lng: 0,
        amenities: Amenities(),
        image: '',
        images: [],
        area: 0,
        phone: '',
        ownerName: '',
        verificationLevel: 'none',
      ),
    );

    if (property.id.isEmpty) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isFavorite = propertiesProvider.isFavorite(property.id);
    final isInCompare = compareProvider.isInCompare(property.id);

    // Owner check removed (unused) to satisfy analyzer

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Header app bar with image
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            backgroundColor: isDark
                ? AppColors.darkBackground
                : AppColors.primary,
            actions: [
              IconButton(
                icon: Icon(
                  isFavorite ? Icons.favorite : Icons.favorite_border,
                  color: isFavorite ? AppColors.error : Colors.white,
                ),
                onPressed: () => propertiesProvider.toggleFavorite(property.id),
              ),
              IconButton(
                icon: Icon(
                  isInCompare ? Icons.compare_arrows : Icons.compare,
                  color: isInCompare ? AppColors.info : Colors.white,
                ),
                onPressed: () {
                  if (isInCompare) {
                    compareProvider.removeFromCompare(property.id);
                  } else {
                    compareProvider.addToCompare(property);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Đã thêm "${property.name}" vào danh sách so sánh.',
                        ),
                        action: SnackBarAction(
                          label: 'So sánh',
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const CompareScreen(),
                              ),
                            );
                          },
                        ),
                      ),
                    );
                  }
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: property.images.isNotEmpty
                  ? Image.network(property.images.first, fit: BoxFit.cover)
                  : Image.network(property.image, fit: BoxFit.cover),
            ),
          ),

          // Detail Content
          SliverList(
            delegate: SliverChildListDelegate([
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title & Badge
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            property.name,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? AppColors.darkForeground
                                  : AppColors.primary,
                            ),
                          ),
                        ),
                        if (property.verificationLevel == 'verified')
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.success,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Row(
                              children: [
                                Icon(
                                  Icons.verified,
                                  color: Colors.white,
                                  size: 12,
                                ),
                                SizedBox(width: 4),
                                Text(
                                  'ĐÃ XÁC MINH',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Price & Area
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatPrice(property.price),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.info,
                          ),
                        ),
                        Text(
                          'Diện tích: ${property.area} m²',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: isDark
                                ? AppColors.darkForeground
                                : AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(),
                    const SizedBox(height: 12),

                    // Address
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.location_on,
                          color: AppColors.mutedForeground,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            property.address,
                            style: TextStyle(
                              fontSize: 14,
                              color: isDark
                                  ? AppColors.darkForeground
                                  : AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Description
                    Text(
                      'Mô tả phòng trọ',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? AppColors.darkForeground
                            : AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      property.description.isEmpty
                          ? 'Chưa có thông tin mô tả chi tiết cho phòng trọ này.'
                          : property.description,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.mutedForeground,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Amenities
                    Text(
                      'Tiện ích có sẵn',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? AppColors.darkForeground
                            : AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildAmenitiesGrid(property.amenities, isDark),
                    const SizedBox(height: 24),

                    // Landlord Info
                    Text(
                      'Thông tin chủ phòng',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? AppColors.darkForeground
                            : AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.darkSecondary
                            : AppColors.secondary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            backgroundColor: AppColors.muted,
                            child: Icon(
                              Icons.person,
                              color: AppColors.mutedForeground,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  property.ownerName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Thành viên của MapHome',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.mutedForeground,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.phone,
                              color: AppColors.success,
                            ),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Gọi chủ trọ: ${property.phone}',
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Location on Map
                    Text(
                      'Bản đồ vị trí',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? AppColors.darkForeground
                            : AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 200,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: MaplibreMap(
                          initialCameraPosition: CameraPosition(
                            target: LatLng(property.lat, property.lng),
                            zoom: 15.0,
                          ),
                          styleString: useGoong
                              ? 'https://tiles.goong.io/assets/goong_map_web.json?api_key=$goongMapTilesKey'
                              : 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
                          onMapCreated: (controller) {
                            _mapController = controller;
                          },
                          onStyleLoadedCallback: () {
                            _mapController?.addCircle(
                              CircleOptions(
                                geometry: LatLng(property.lat, property.lng),
                                circleColor: property.verificationLevel == 'verified' ? '#4CAF50' : '#F44336',
                                circleRadius: 12.0,
                                circleStrokeColor: '#FFFFFF',
                                circleStrokeWidth: 3.0,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Action Request Verification for landlord or Booking for User
                    if (property.verificationLevel == 'none') ...[
                      ElevatedButton.icon(
                        onPressed: _submittingInspection
                            ? null
                            : () => _requestVerification(property),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.teal,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        icon: _submittingInspection
                            ? const SizedBox(
                                height: 16,
                                width: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Icon(Icons.verified_user),
                        label: const Text(
                          'Yêu cầu thanh tra & cấp Huy hiệu xanh',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

                    ElevatedButton.icon(
                      onPressed: () => _showBookingDialog(property, isDark),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark
                            ? AppColors.darkForeground
                            : AppColors.primary,
                        foregroundColor: isDark
                            ? AppColors.primary
                            : Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      icon: const Icon(Icons.calendar_month),
                      label: const Text(
                        'Đặt lịch hẹn xem phòng',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildAmenitiesGrid(Amenities amenities, bool isDark) {
    final List<Map<String, dynamic>> items = [];
    if (amenities.wifi) items.add({'label': 'Wifi', 'icon': Icons.wifi});
    if (amenities.furniture)
      items.add({'label': 'Nội thất', 'icon': Icons.chair_outlined});
    if (amenities.tv) items.add({'label': 'Tivi', 'icon': Icons.tv});
    if (amenities.washingMachine)
      items.add({
        'label': 'Máy giặt',
        'icon': Icons.local_laundry_service_outlined,
      });
    if (amenities.kitchen)
      items.add({'label': 'Nhà bếp', 'icon': Icons.kitchen_outlined});
    if (amenities.refrigerator)
      items.add({'label': 'Tủ lạnh', 'icon': Icons.kitchen});
    if (amenities.airConditioner)
      items.add({'label': 'Điều hòa', 'icon': Icons.ac_unit});

    if (items.isEmpty) {
      return const Text(
        'Không có tiện ích nổi bật nào được đăng ký.',
        style: TextStyle(color: AppColors.mutedForeground, fontSize: 13),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 2.2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSecondary : AppColors.secondary,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(item['icon'], size: 16, color: AppColors.info),
              const SizedBox(width: 6),
              Text(
                item['label'],
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
