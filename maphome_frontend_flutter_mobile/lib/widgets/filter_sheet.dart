import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class FilterSheet extends StatefulWidget {
  final Map<String, dynamic> initialFilters;
  final Function(Map<String, dynamic>) onApply;

  const FilterSheet({
    super.key,
    required this.initialFilters,
    required this.onApply,
  });

  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  late RangeValues _priceRange;
  late RangeValues _areaRange;
  
  late Map<String, bool> _amenities;
  late String _verificationLevel;
  late String _sortBy;

  @override
  void initState() {
    super.initState();
    // Initialize filter states
    final priceMin = widget.initialFilters['priceMin']?.toDouble() ?? 0.0;
    final priceMax = widget.initialFilters['priceMax']?.toDouble() ?? 15000000.0;
    _priceRange = RangeValues(priceMin, priceMax);

    final areaMin = widget.initialFilters['areaMin']?.toDouble() ?? 10.0;
    final areaMax = widget.initialFilters['areaMax']?.toDouble() ?? 100.0;
    _areaRange = RangeValues(areaMin, areaMax);

    _amenities = Map<String, bool>.from(widget.initialFilters['amenities'] ?? {
      'wifi': false,
      'furniture': false,
      'tv': false,
      'washingMachine': false,
      'kitchen': false,
      'refrigerator': false,
      'airConditioner': false,
    });

    _verificationLevel = widget.initialFilters['verificationLevel'] ?? 'all';
    _sortBy = widget.initialFilters['sortBy'] ?? 'price-asc';
  }

  void _resetFilters() {
    setState(() {
      _priceRange = const RangeValues(0.0, 15000000.0);
      _areaRange = const RangeValues(10.0, 100.0);
      _amenities = {
        'wifi': false,
        'furniture': false,
        'tv': false,
        'washingMachine': false,
        'kitchen': false,
        'refrigerator': false,
        'airConditioner': false,
      };
      _verificationLevel = 'all';
      _sortBy = 'price-asc';
    });
  }

  void _applyFilters() {
    widget.onApply({
      'priceMin': _priceRange.start.round(),
      'priceMax': _priceRange.end.round(),
      'areaMin': _areaRange.start.round(),
      'areaMax': _areaRange.end.round(),
      'amenities': _amenities,
      'verificationLevel': _verificationLevel,
      'sortBy': _sortBy,
    });
    Navigator.pop(context);
  }

  String _formatPrice(double value) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)} tr';
    }
    return '${(value / 1000).toStringAsFixed(0)} k';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Bộ lọc tìm kiếm',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.darkForeground : AppColors.primary,
                  ),
                ),
                TextButton(
                  onPressed: _resetFilters,
                  child: const Text('Đặt lại', style: TextStyle(color: AppColors.error)),
                ),
              ],
            ),
            const Divider(),
            const SizedBox(height: 12),

            // Sort Options
            Text(
              'Sắp xếp theo',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkForeground : AppColors.primary,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                _buildChoiceChip('Giá tăng dần', _sortBy == 'price-asc', () => setState(() => _sortBy = 'price-asc')),
                _buildChoiceChip('Giá giảm dần', _sortBy == 'price-desc', () => setState(() => _sortBy = 'price-desc')),
                _buildChoiceChip('Diện tích lớn nhất', _sortBy == 'area', () => setState(() => _sortBy = 'area')),
              ],
            ),
            const SizedBox(height: 20),

            // Price range
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Khoảng giá (VND / tháng)',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.darkForeground : AppColors.primary,
                  ),
                ),
                Text(
                  '${_formatPrice(_priceRange.start)} - ${_formatPrice(_priceRange.end)}',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.info),
                ),
              ],
            ),
            RangeSlider(
              values: _priceRange,
              min: 0.0,
              max: 15000000.0,
              divisions: 30,
              activeColor: isDark ? AppColors.darkForeground : AppColors.primary,
              inactiveColor: AppColors.muted,
              onChanged: (values) {
                setState(() {
                  _priceRange = values;
                });
              },
            ),
            const SizedBox(height: 16),

            // Area range
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Diện tích (m²)',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.darkForeground : AppColors.primary,
                  ),
                ),
                Text(
                  '${_areaRange.start.round()} - ${_areaRange.end.round()} m²',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.info),
                ),
              ],
            ),
            RangeSlider(
              values: _areaRange,
              min: 10.0,
              max: 100.0,
              divisions: 18,
              activeColor: isDark ? AppColors.darkForeground : AppColors.primary,
              inactiveColor: AppColors.muted,
              onChanged: (values) {
                setState(() {
                  _areaRange = values;
                });
              },
            ),
            const SizedBox(height: 16),

            // Verification Level
            Text(
              'Trạng thái xác minh',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkForeground : AppColors.primary,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildChoiceChip('Tất cả', _verificationLevel == 'all', () => setState(() => _verificationLevel = 'all')),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildChoiceChip('Có huy hiệu xanh', _verificationLevel == 'verified', () => setState(() => _verificationLevel = 'verified')),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Amenities
            Text(
              'Tiện ích',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkForeground : AppColors.primary,
              ),
            ),
            const SizedBox(height: 8),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 3.5,
              children: _amenities.keys.map((key) {
                String label = '';
                IconData icon = Icons.check;
                switch (key) {
                  case 'wifi':
                    label = 'Wifi';
                    icon = Icons.wifi;
                    break;
                  case 'furniture':
                    label = 'Nội thất';
                    icon = Icons.chair_outlined;
                    break;
                  case 'tv':
                    label = 'Tivi';
                    icon = Icons.tv;
                    break;
                  case 'washingMachine':
                    label = 'Máy giặt';
                    icon = Icons.local_laundry_service_outlined;
                    break;
                  case 'kitchen':
                    label = 'Nhà bếp';
                    icon = Icons.kitchen_outlined;
                    break;
                  case 'refrigerator':
                    label = 'Tủ lạnh';
                    icon = Icons.kitchen;
                    break;
                  case 'airConditioner':
                    label = 'Điều hòa';
                    icon = Icons.ac_unit;
                    break;
                }
                return CheckboxListTile(
                  title: Row(
                    children: [
                      Icon(icon, size: 18, color: AppColors.mutedForeground),
                      const SizedBox(width: 8),
                      Text(label, style: const TextStyle(fontSize: 13)),
                    ],
                  ),
                  value: _amenities[key],
                  activeColor: AppColors.primary,
                  contentPadding: EdgeInsets.zero,
                  onChanged: (val) {
                    setState(() {
                      _amenities[key] = val ?? false;
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            // Apply Button
            ElevatedButton(
              onPressed: _applyFilters,
              style: ElevatedButton.styleFrom(
                backgroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
                foregroundColor: isDark ? AppColors.primary : Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text('Áp dụng bộ lọc', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChoiceChip(String label, bool isSelected, VoidCallback onTap) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onTap(),
      selectedColor: isDark ? AppColors.darkSecondary : AppColors.primary,
      backgroundColor: Colors.transparent,
      labelStyle: TextStyle(
        color: isSelected 
            ? (isDark ? Colors.white : Colors.white) 
            : (isDark ? AppColors.darkForeground : AppColors.primary),
        fontSize: 13,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isSelected 
              ? (isDark ? AppColors.darkSecondary : AppColors.primary) 
              : AppColors.muted,
        ),
      ),
    );
  }
}
