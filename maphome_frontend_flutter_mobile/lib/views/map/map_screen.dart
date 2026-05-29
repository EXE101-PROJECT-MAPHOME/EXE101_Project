import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../constants/app_colors.dart';
import '../../constants/goong.dart';
import '../../models/property_model.dart';
import '../../providers/properties_provider.dart';
import '../../widgets/custom_card.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  RentalProperty? _selectedProperty;

  @override
  Widget build(BuildContext context) {
    final propertiesProvider = Provider.of<PropertiesProvider>(context);
    final properties = propertiesProvider.properties;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calculate center coordinates
    LatLng center = const LatLng(21.0285, 105.8542); // Hanoi
    if (properties.isNotEmpty) {
      double totalLat = 0;
      double totalLng = 0;
      for (var p in properties) {
        totalLat += p.lat;
        totalLng += p.lng;
      }
      center = LatLng(
        totalLat / properties.length,
        totalLng / properties.length,
      );
    }

    // Build map markers
    final markers = properties.map((property) {
      final isSelected = _selectedProperty?.id == property.id;
      return Marker(
        point: LatLng(property.lat, property.lng),
        width: 40,
        height: 40,
        child: GestureDetector(
          onTap: () {
            setState(() {
              _selectedProperty = property;
            });
            _mapController.move(LatLng(property.lat, property.lng), 15.0);
          },
          child: Icon(
            Icons.location_on,
            color: isSelected
                ? AppColors.error
                : (property.verificationLevel == 'verified'
                      ? AppColors.success
                      : AppColors.info),
            size: isSelected ? 40 : 32,
          ),
        ),
      );
    }).toList();

    return Scaffold(
      body: Stack(
        children: [
          // Flutter Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: 13.0,
              onTap: (_, __) {
                setState(() {
                  _selectedProperty = null;
                });
              },
            ),
            children: [
              // Tile Layer: Goong tiles with OpenStreetMap fallback
              TileLayer(
                urlTemplate: useGoong
                    ? 'https://tiles.goong.io/tiles/{z}/{x}/{y}.png?api_key=$goongApiKey'
                    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.maphome.app',
              ),
              MarkerLayer(markers: markers),
            ],
          ),

          // Search Bar overlay
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            right: 16,
            child: Container(
              height: 54,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.border,
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.12),
                    blurRadius: 12,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  Icon(
                    Icons.search,
                    color: isDark
                        ? AppColors.darkMutedForeground
                        : AppColors.mutedForeground,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      style: TextStyle(
                        color: isDark
                            ? AppColors.darkForeground
                            : AppColors.foreground,
                        fontSize: 15,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Tìm địa chỉ, trường học...',
                        hintStyle: TextStyle(
                          color: isDark
                              ? AppColors.darkMutedForeground
                              : AppColors.mutedForeground,
                          fontSize: 14,
                        ),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.zero,
                      ),
                      onSubmitted: (value) {
                        // Implement local search geocoding or markers filtering
                      },
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.my_location,
                      color: AppColors.primary,
                    ),
                    tooltip: 'Vị trí hiện tại',
                    onPressed: () {
                      if (properties.isNotEmpty) {
                        _mapController.move(center, 13.0);
                      }
                    },
                  ),
                ],
              ),
            ),
          ),

          // Property preview slider overlay
          if (_selectedProperty != null)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Stack(
                children: [
                  CustomCard(property: _selectedProperty!, isHorizontal: true),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedProperty = null;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.border, width: 1),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 16,
                          color: AppColors.foreground,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
