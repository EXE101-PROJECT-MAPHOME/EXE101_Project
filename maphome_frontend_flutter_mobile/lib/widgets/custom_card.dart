import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../models/property_model.dart';
import '../providers/properties_provider.dart';
import '../providers/compare_provider.dart';
import '../views/detail/room_detail_screen.dart';

class CustomCard extends StatelessWidget {
  final RentalProperty property;
  final bool isHorizontal;

  const CustomCard({
    super.key,
    required this.property,
    this.isHorizontal = false,
  });

  String _formatPrice(int price) {
    final formatter = NumberFormat('#,###', 'vi_VN');
    return '${formatter.format(price)}đ';
  }

  void _showBookingDialog(
    BuildContext context,
    RentalProperty property,
    bool isDark,
  ) {
    final dateController = TextEditingController(text: '30/05/2026');
    final timeController = TextEditingController(text: '09:00');
    final noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: isDark ? AppColors.darkCard : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            'Đặt lịch hẹn xem phòng',
            style: TextStyle(
              color: isDark ? AppColors.darkForeground : AppColors.primary,
              fontWeight: FontWeight.bold,
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
                backgroundColor: AppColors.primaryDark,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text('Gửi lịch hẹn'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final propertiesProvider = Provider.of<PropertiesProvider>(context);
    final compareProvider = Provider.of<CompareProvider>(context);
    final isFavorite = propertiesProvider.isFavorite(property.id);
    final inCompare = compareProvider.isInCompare(property.id);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (isHorizontal) {
      return _buildHorizontalCard(
        context,
        isFavorite,
        inCompare,
        propertiesProvider,
        compareProvider,
        isDark,
      );
    }
    return _buildVerticalCard(
      context,
      isFavorite,
      inCompare,
      propertiesProvider,
      compareProvider,
      isDark,
    );
  }

  Widget _buildVerticalCard(
    BuildContext context,
    bool isFavorite,
    bool inCompare,
    PropertiesProvider provider,
    CompareProvider compareProvider,
    bool isDark,
  ) {
    final activeAmenities = _getActiveAmenitiesList();

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => RoomDetailScreen(propertyId: property.id),
          ),
        );
      },
      child: Container(
        width: 280,
        margin: const EdgeInsets.only(right: 18, bottom: 12, top: 4),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(
            color: isDark ? AppColors.darkBorder : AppColors.muted,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withOpacity(0.3)
                  : const Color(0xFFE2E8F0).withOpacity(0.4),
              blurRadius: 16,
              spreadRadius: 2,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image Section
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(30),
                  ),
                  child: Image.network(
                    property.image,
                    height: 150,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 150,
                        color: AppColors.muted,
                        child: const Icon(
                          Icons.broken_image_outlined,
                          color: AppColors.mutedForeground,
                        ),
                      );
                    },
                  ),
                ),
                // Availability Badge
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: property.available
                          ? AppColors.primaryDark
                          : AppColors.mutedForeground.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      property.available ? 'Còn phòng' : 'Hết phòng',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                // Green Badge (Verification badge)
                if (property.verificationLevel == 'verified')
                  Positioned(
                    top: 45,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.success,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.verified, color: Colors.white, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'XÁC MINH',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                // Favorite Button
                Positioned(
                  top: 10,
                  right: 10,
                  child: GestureDetector(
                    onTap: () => provider.toggleFavorite(property.id),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? AppColors.error : AppColors.primary,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Content Section
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    property.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: isDark
                          ? AppColors.darkForeground
                          : AppColors.primary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Location Address
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 14,
                        color: AppColors.mutedForeground,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          property.address,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Price / Area Grid Row (Exactly matching web style layout)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      border: Border.symmetric(
                        horizontal: BorderSide(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.muted,
                          width: 1,
                        ),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _formatPrice(property.price),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: AppColors.success,
                              ),
                            ),
                            const Text(
                              '/ THÁNG',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: AppColors.mutedForeground,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${property.area}m²',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: isDark
                                    ? AppColors.darkForeground
                                    : AppColors.primary,
                              ),
                            ),
                            const Text(
                              'DIỆN TÍCH',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: AppColors.mutedForeground,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Amenities Grid list (first 4 items)
                  const Text(
                    'Tiện ích:',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: activeAmenities.take(3).map((amenity) {
                      return Chip(
                        avatar: Icon(
                          amenity['icon'],
                          size: 12,
                          color: AppColors.primaryDark,
                        ),
                        label: Text(
                          amenity['label'],
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        backgroundColor: isDark
                            ? AppColors.darkSecondary
                            : AppColors.secondary,
                        side: BorderSide.none,
                        padding: EdgeInsets.zero,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),

                  // Landlord Info Line
                  Row(
                    children: [
                      const Icon(
                        Icons.account_circle_outlined,
                        size: 14,
                        color: AppColors.mutedForeground,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          property.ownerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Button Actions Grid
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Đang gọi chủ trọ: ${property.phone}',
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.phone_outlined, size: 14),
                          label: const Text(
                            'Gọi',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: isDark
                                ? AppColors.darkForeground
                                : AppColors.primary,
                            side: BorderSide(
                              color: isDark
                                  ? AppColors.darkBorder
                                  : AppColors.border,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () =>
                              _showBookingDialog(context, property, isDark),
                          icon: const Icon(
                            Icons.calendar_today_outlined,
                            size: 14,
                          ),
                          label: const Text(
                            'Đặt lịch',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            elevation: 0,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            if (inCompare) {
                              compareProvider.removeFromCompare(property.id);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Đã xóa khỏi danh sách so sánh',
                                  ),
                                ),
                              );
                            } else {
                              if (compareProvider.compareList.length >= 4) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Chỉ có thể so sánh tối đa 4 phòng cùng lúc',
                                    ),
                                  ),
                                );
                                return;
                              }
                              compareProvider.addToCompare(property);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Đã thêm vào danh sách so sánh',
                                  ),
                                ),
                              );
                            }
                          },
                          icon: Icon(
                            inCompare ? Icons.check : Icons.compare_arrows,
                            size: 14,
                          ),
                          label: Text(
                            inCompare ? 'Đã chọn' : 'So sánh',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: inCompare
                                ? AppColors.info
                                : (isDark
                                      ? AppColors.darkForeground
                                      : AppColors.primary),
                            side: BorderSide(
                              color: inCompare
                                  ? AppColors.info
                                  : (isDark
                                        ? AppColors.darkBorder
                                        : AppColors.border),
                            ),
                            backgroundColor: inCompare
                                ? (isDark
                                      ? AppColors.info.withOpacity(0.1)
                                      : const Color(0xFFEFF6FF))
                                : Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHorizontalCard(
    BuildContext context,
    bool isFavorite,
    bool inCompare,
    PropertiesProvider provider,
    CompareProvider compareProvider,
    bool isDark,
  ) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => RoomDetailScreen(propertyId: property.id),
          ),
        );
      },
      child: Container(
        height: 140,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? AppColors.darkBorder : AppColors.muted,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withOpacity(0.2)
                  : const Color(0xFFE2E8F0).withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Image Left section
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.horizontal(
                    left: Radius.circular(22),
                  ),
                  child: Image.network(
                    property.image,
                    width: 130,
                    height: 140,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 130,
                        height: 140,
                        color: AppColors.muted,
                        child: const Icon(
                          Icons.broken_image_outlined,
                          color: AppColors.mutedForeground,
                        ),
                      );
                    },
                  ),
                ),
                if (property.verificationLevel == 'verified')
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.verified,
                        color: Colors.white,
                        size: 10,
                      ),
                    ),
                  ),
              ],
            ),

            // Text Info Right section
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          property.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: isDark
                                ? AppColors.darkForeground
                                : AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          property.address,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      ],
                    ),

                    // Price Area Middle Line
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatPrice(property.price),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: AppColors.success,
                          ),
                        ),
                        Text(
                          '${property.area} m²',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? AppColors.darkForeground
                                : AppColors.primary,
                          ),
                        ),
                      ],
                    ),

                    // Foot Actions Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          property.ownerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () => provider.toggleFavorite(property.id),
                              child: Icon(
                                isFavorite
                                    ? Icons.favorite
                                    : Icons.favorite_border,
                                color: isFavorite
                                    ? AppColors.error
                                    : AppColors.mutedForeground,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 12),
                            GestureDetector(
                              onTap: () {
                                if (inCompare) {
                                  compareProvider.removeFromCompare(
                                    property.id,
                                  );
                                } else {
                                  if (compareProvider.compareList.length >= 4) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Chỉ so sánh tối đa 4 phòng',
                                        ),
                                      ),
                                    );
                                    return;
                                  }
                                  compareProvider.addToCompare(property);
                                }
                              },
                              child: Icon(
                                inCompare
                                    ? Icons.check_circle
                                    : Icons.compare_arrows,
                                color: inCompare
                                    ? AppColors.info
                                    : AppColors.mutedForeground,
                                size: 18,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _getActiveAmenitiesList() {
    final List<Map<String, dynamic>> list = [];
    if (property.amenities.wifi) {
      list.add({'label': 'WiFi', 'icon': Icons.wifi});
    }
    if (property.amenities.furniture) {
      list.add({'label': 'Nội thất', 'icon': Icons.chair_outlined});
    }
    if (property.amenities.tv) {
      list.add({'label': 'TV', 'icon': Icons.tv});
    }
    if (property.amenities.washingMachine) {
      list.add({
        'label': 'Máy giặt',
        'icon': Icons.local_laundry_service_outlined,
      });
    }
    if (property.amenities.kitchen) {
      list.add({'label': 'Nhà bếp', 'icon': Icons.kitchen_outlined});
    }
    if (property.amenities.refrigerator) {
      list.add({'label': 'Tủ lạnh', 'icon': Icons.kitchen});
    }
    if (property.amenities.airConditioner) {
      list.add({'label': 'Điều hòa', 'icon': Icons.ac_unit});
    }
    return list;
  }
}
