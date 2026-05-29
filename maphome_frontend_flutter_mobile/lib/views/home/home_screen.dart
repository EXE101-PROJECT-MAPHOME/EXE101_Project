import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/properties_provider.dart';
import '../../providers/compare_provider.dart';
import '../../widgets/custom_card.dart';
import '../../widgets/filter_sheet.dart';
import '../compare/compare_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  // Default search parameters
  final Map<String, dynamic> _filters = {
    'priceMin': 0,
    'priceMax': 15000000,
    'areaMin': 10,
    'areaMax': 100,
    'amenities': {
      'wifi': false,
      'furniture': false,
      'tv': false,
      'washingMachine': false,
      'kitchen': false,
      'refrigerator': false,
      'airConditioner': false,
    },
    'verificationLevel': 'all',
    'sortBy': 'price-asc',
  };

  final List<String> _bannerImages = [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop&q=80',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _triggerSearch() {
    final query = _searchController.text.trim();
    final Map<String, dynamic> apiParams = {
      'q': query.isEmpty ? null : query,
      'priceMin': _filters['priceMin'],
      'priceMax': _filters['priceMax'],
      'areaMin': _filters['areaMin'],
      'areaMax': _filters['areaMax'],
      'verificationLevel': _filters['verificationLevel'] == 'all'
          ? null
          : _filters['verificationLevel'],
      'sortBy': _filters['sortBy'],
    };

    // Include amenities
    final amenities = _filters['amenities'] as Map<String, bool>;
    amenities.forEach((key, value) {
      if (value) {
        apiParams[key] = true;
      }
    });

    Provider.of<PropertiesProvider>(
      context,
      listen: false,
    ).searchProperties(apiParams);
  }

  void _openFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return FilterSheet(
          initialFilters: _filters,
          onApply: (appliedFilters) {
            setState(() {
              _filters.addAll(appliedFilters);
            });
            _triggerSearch();
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final propertiesProvider = Provider.of<PropertiesProvider>(context);
    final compareProvider = Provider.of<CompareProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final allProperties = propertiesProvider.properties;
    final verifiedProperties = allProperties
        .where((p) => p.verificationLevel == 'verified')
        .toList();

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, Color(0xFF16A34A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.home, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'MapHome',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 22,
                letterSpacing: 0.3,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
        backgroundColor: isDark
            ? AppColors.darkBackground
            : AppColors.background,
        foregroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
        elevation: 0.5,
        actions: [
          // Compare floating button indicator
          if (compareProvider.compareList.isNotEmpty)
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.compare_arrows, size: 24),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const CompareScreen(),
                      ),
                    );
                  },
                ),
                Positioned(
                  top: 6,
                  right: 6,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${compareProvider.compareList.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          _searchController.clear();
          await propertiesProvider.fetchProperties();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Section with Greeting
              Container(
                margin: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.1),
                      AppColors.accent.withOpacity(0.5),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.primary.withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Text(
                  auth.isAuthenticated
                      ? 'Xin chào, ${auth.user?.fullName ?? auth.user?.username} 👋'
                      : 'Tìm kiếm phòng trọ mơ ước của bạn',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),

              // Modern Search Bar & Filter
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12.0,
                  vertical: 8.0,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.darkSecondary
                              : AppColors.inputBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark
                                ? AppColors.darkBorder
                                : AppColors.border,
                            width: 1,
                          ),
                        ),
                        child: TextField(
                          controller: _searchController,
                          textInputAction: TextInputAction.search,
                          onSubmitted: (_) => _triggerSearch(),
                          style: TextStyle(
                            color: isDark
                                ? AppColors.darkForeground
                                : AppColors.foreground,
                            fontSize: 15,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Tìm theo tên, địa chỉ...',
                            hintStyle: TextStyle(
                              color: isDark
                                  ? AppColors.darkMutedForeground
                                  : AppColors.mutedForeground,
                              fontSize: 14,
                            ),
                            border: InputBorder.none,
                            prefixIcon: Icon(
                              Icons.search,
                              color: isDark
                                  ? AppColors.darkMutedForeground
                                  : AppColors.mutedForeground,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 13,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    GestureDetector(
                      onTap: _openFilterSheet,
                      child: Container(
                        padding: const EdgeInsets.all(13),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.primary, Color(0xFF16A34A)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.filter_list,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Banners Carousel with improved styling
              if (_bannerImages.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: CarouselSlider(
                      options: CarouselOptions(
                        height: 180.0,
                        autoPlay: true,
                        enlargeCenterPage: false,
                        aspectRatio: 16 / 9,
                        viewportFraction: 1.0,
                        autoPlayInterval: const Duration(seconds: 5),
                      ),
                      items: _bannerImages.map((imageUrl) {
                        return Builder(
                          builder: (BuildContext context) {
                            return ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Stack(
                                children: [
                                  Image.network(
                                    imageUrl,
                                    fit: BoxFit.cover,
                                    width: double.infinity,
                                  ),
                                  Positioned.fill(
                                    child: Container(
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                          colors: [
                                            Colors.transparent,
                                            Colors.black.withOpacity(0.3),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ),
              const SizedBox(height: 28),

              // Verified properties section
              if (verifiedProperties.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 4,
                            height: 24,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            '⭐ Phòng được xác minh',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? AppColors.darkForeground
                                  : AppColors.foreground,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${verifiedProperties.length} phòng đã được xác thực',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark
                              ? AppColors.darkMutedForeground
                              : AppColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  height: 420,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    scrollDirection: Axis.horizontal,
                    itemCount: verifiedProperties.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: CustomCard(property: verifiedProperties[index]),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 32),
              ],

              // All properties section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 4,
                          height: 24,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Tất cả phòng trọ',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? AppColors.darkForeground
                                : AppColors.foreground,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${allProperties.length} phòng trọ khả dụng',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? AppColors.darkMutedForeground
                            : AppColors.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              propertiesProvider.loading
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(40.0),
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.primary,
                          ),
                        ),
                      ),
                    )
                  : allProperties.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.search_off,
                              size: 48,
                              color: isDark
                                  ? AppColors.darkMutedForeground
                                  : AppColors.mutedForeground,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Không tìm thấy phòng trọ nào',
                              style: TextStyle(
                                color: isDark
                                    ? AppColors.darkMutedForeground
                                    : AppColors.mutedForeground,
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: allProperties.length,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: CustomCard(
                            property: allProperties[index],
                            isHorizontal: true,
                          ),
                        );
                      },
                    ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
