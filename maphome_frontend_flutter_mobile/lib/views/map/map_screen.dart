import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maplibre_gl/mapbox_gl.dart';
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
  MaplibreMapController? _mapController;
  RentalProperty? _selectedProperty;
  List<RentalProperty> _properties = [];
  bool _isStyleLoaded = false;

  void _onMapCreated(MaplibreMapController controller) {
    _mapController = controller;
    _mapController?.onCircleTapped.add(_onCircleTapped);
  }

  void _onCircleTapped(Circle circle) {
    final id = circle.data?['id'] as String?;
    if (id != null) {
      try {
        final prop = _properties.firstWhere((p) => p.id == id);
        setState(() {
          _selectedProperty = prop;
        });
        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(LatLng(prop.lat, prop.lng), 15.0),
        );
      } catch (e) {
        // Property not found
      }
    }
  }

  void _onStyleLoaded() {
    _isStyleLoaded = true;
    _addPropertyMarkers();
  }

  void _addPropertyMarkers() async {
    if (_mapController == null || !_isStyleLoaded) return;
    await _mapController?.clearCircles();
    for (var prop in _properties) {
      await _mapController?.addCircle(
        CircleOptions(
          geometry: LatLng(prop.lat, prop.lng),
          circleColor: prop.verificationLevel == 'verified' ? '#4CAF50' : '#2196F3',
          circleRadius: 10.0,
          circleStrokeColor: '#FFFFFF',
          circleStrokeWidth: 2.0,
        ),
        {'id': prop.id},
      );
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final propertiesProvider = Provider.of<PropertiesProvider>(context);
    if (_properties != propertiesProvider.properties) {
      _properties = propertiesProvider.properties;
      _addPropertyMarkers();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calculate center coordinates
    LatLng center = const LatLng(21.0285, 105.8542); // Hanoi
    if (_properties.isNotEmpty) {
      double totalLat = 0;
      double totalLng = 0;
      for (var p in _properties) {
        totalLat += p.lat;
        totalLng += p.lng;
      }
      center = LatLng(
        totalLat / _properties.length,
        totalLng / _properties.length,
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // Maplibre Map
          MaplibreMap(
            onMapCreated: _onMapCreated,
            onStyleLoadedCallback: _onStyleLoaded,
            initialCameraPosition: CameraPosition(
              target: center,
              zoom: 13.0,
            ),
            styleString: useGoong
                ? 'https://tiles.goong.io/assets/goong_map_web.json?api_key=$goongMapTilesKey'
                : 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
            myLocationEnabled: true,
            onMapClick: (point, latLng) {
              setState(() {
                _selectedProperty = null;
              });
            },
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
                      if (_properties.isNotEmpty) {
                        _mapController?.animateCamera(
                          CameraUpdate.newLatLngZoom(center, 13.0),
                        );
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
