import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/app_colors.dart';
import '../../providers/compare_provider.dart';
import '../../models/property_model.dart';

class CompareScreen extends StatelessWidget {
  const CompareScreen({super.key});

  String _formatPrice(int price) {
    if (price >= 1000000) {
      double value = price / 1000000;
      return '${value.toStringAsFixed(value == value.toInt() ? 0 : 1)} tr/tháng';
    }
    final formatter = NumberFormat('#,###', 'vi_VN');
    return '${formatter.format(price)} đ';
  }

  @override
  Widget build(BuildContext context) {
    final compareProvider = Provider.of<CompareProvider>(context);
    final list = compareProvider.compareList;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('So sánh phòng trọ', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
        foregroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
        elevation: 0,
        actions: [
          if (list.isNotEmpty)
            TextButton(
              onPressed: () => compareProvider.clearCompare(),
              child: const Text('Xóa tất cả', style: TextStyle(color: AppColors.error)),
            )
        ],
      ),
      body: list.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.compare, size: 64, color: AppColors.mutedForeground),
                  SizedBox(height: 16),
                  Text(
                    'Danh sách so sánh trống.',
                    style: TextStyle(color: AppColors.mutedForeground, fontSize: 16),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Thêm tối đa 4 phòng trọ ở trang chi tiết để so sánh.',
                    style: TextStyle(color: AppColors.mutedForeground, fontSize: 13),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              scrollDirection: Axis.vertical,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columnSpacing: 20,
                  headingRowColor: WidgetStateProperty.resolveWith(
                    (states) => isDark ? AppColors.darkSecondary : AppColors.secondary,
                  ),
                  columns: [
                    const DataColumn(
                      label: Text('Đặc tính', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    ...list.map(
                      (p) => DataColumn(
                        label: SizedBox(
                          width: 140,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      p.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => compareProvider.removeFromCompare(p.id),
                                    child: const Icon(Icons.cancel, size: 16, color: AppColors.error),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  rows: [
                    // Price Row
                    DataRow(cells: [
                      const DataCell(Text('Giá thuê', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(Text(_formatPrice(p.price), style: const TextStyle(color: AppColors.info, fontWeight: FontWeight.bold)))),
                    ]),
                    // Area Row
                    DataRow(cells: [
                      const DataCell(Text('Diện tích', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(Text('${p.area} m²'))),
                    ]),
                    // Verification Status Row
                    DataRow(cells: [
                      const DataCell(Text('Xác minh', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(
                            p.verificationLevel == 'verified'
                                ? const Row(
                                    children: [
                                      Icon(Icons.verified, color: AppColors.success, size: 16),
                                      SizedBox(width: 4),
                                      Text('Đã xác minh', style: TextStyle(color: AppColors.success, fontSize: 12)),
                                    ],
                                  )
                                : const Text('Chưa xác minh', style: TextStyle(color: AppColors.mutedForeground, fontSize: 12)),
                          )),
                    ]),
                    // Amenities - Wifi
                    DataRow(cells: [
                      const DataCell(Text('Wifi', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(Icon(p.amenities.wifi ? Icons.check_circle : Icons.cancel_outlined, color: p.amenities.wifi ? AppColors.success : AppColors.mutedForeground, size: 18))),
                    ]),
                    // Amenities - Furniture
                    DataRow(cells: [
                      const DataCell(Text('Nội thất', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(Icon(p.amenities.furniture ? Icons.check_circle : Icons.cancel_outlined, color: p.amenities.furniture ? AppColors.success : AppColors.mutedForeground, size: 18))),
                    ]),
                    // Amenities - Air Conditioner
                    DataRow(cells: [
                      const DataCell(Text('Điều hòa', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(Icon(p.amenities.airConditioner ? Icons.check_circle : Icons.cancel_outlined, color: p.amenities.airConditioner ? AppColors.success : AppColors.mutedForeground, size: 18))),
                    ]),
                    // Amenities - Washing Machine
                    DataRow(cells: [
                      const DataCell(Text('Máy giặt', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(Icon(p.amenities.washingMachine ? Icons.check_circle : Icons.cancel_outlined, color: p.amenities.washingMachine ? AppColors.success : AppColors.mutedForeground, size: 18))),
                    ]),
                    // Amenities - Kitchen
                    DataRow(cells: [
                      const DataCell(Text('Bếp riêng', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(Icon(p.amenities.kitchen ? Icons.check_circle : Icons.cancel_outlined, color: p.amenities.kitchen ? AppColors.success : AppColors.mutedForeground, size: 18))),
                    ]),
                    // Contact
                    DataRow(cells: [
                      const DataCell(Text('Chủ trọ', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(Text(p.ownerName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)))),
                    ]),
                    // Address
                    DataRow(cells: [
                      const DataCell(Text('Địa chỉ', style: TextStyle(fontWeight: FontWeight.w500))),
                      ...list.map((p) => DataCell(SizedBox(width: 140, child: Text(p.address, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11))))),
                    ]),
                  ],
                ),
              ),
            ),
    );
  }
}
