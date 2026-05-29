import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/property_model.dart';
import '../services/api_service.dart';

class PropertiesProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<RentalProperty> _properties = [];
  bool _loading = false;
  List<String> _favoriteIds = [];

  List<RentalProperty> get properties => _properties;
  bool get loading => _loading;
  List<String> get favoriteIds => _favoriteIds;

  PropertiesProvider() {
    _loadFavorites();
    fetchProperties();
  }

  Future<void> _loadFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    _favoriteIds = prefs.getStringList('favorites') ?? [];
    notifyListeners();
  }

  Future<void> toggleFavorite(String propertyId) async {
    final isCurrentlyFav = _favoriteIds.contains(propertyId);
    final action = isCurrentlyFav ? 'remove' : 'add';

    // Optimistic update
    if (isCurrentlyFav) {
      _favoriteIds.remove(propertyId);
    } else {
      _favoriteIds.add(propertyId);
    }
    notifyListeners();

    try {
      final response = await _api.post('/api/properties/$propertyId/favorite', {
        'action': action,
      });
      if (response.statusCode == 200) {
        // Success
        final prefs = await SharedPreferences.getInstance();
        await prefs.setStringList('favorites', _favoriteIds);
      } else {
        // Revert on failure
        if (isCurrentlyFav) {
          _favoriteIds.add(propertyId);
        } else {
          _favoriteIds.remove(propertyId);
        }
        notifyListeners();
      }
    } catch (e) {
      // Revert on error
      if (isCurrentlyFav) {
        _favoriteIds.add(propertyId);
      } else {
        _favoriteIds.remove(propertyId);
      }
      notifyListeners();
    }
  }

  bool isFavorite(String propertyId) {
    return _favoriteIds.contains(propertyId);
  }

  List<RentalProperty> get favoriteProperties {
    return _properties.where((p) => _favoriteIds.contains(p.id)).toList();
  }

  Future<void> fetchProperties() async {
    _loading = true;
    notifyListeners();

    try {
      final res = await _api.get('/api/properties');
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        _properties = data
            .map((json) => RentalProperty.fromJson(json))
            .toList();
      }
    } catch (e) {
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> searchProperties(Map<String, dynamic> filters) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.get(
        '/api/properties?${_buildQueryString(filters)}',
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> results = (data is List)
            ? data
            : (data['properties'] ?? []);
        _properties = results
            .map((json) => RentalProperty.fromJson(json))
            .toList();
      }
    } catch (e) {
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  String _buildQueryString(Map<String, dynamic> params) {
    final List<String> queryParts = [];
    params.forEach((key, value) {
      if (value != null) {
        if (value is List) {
          for (var item in value) {
            queryParts.add('$key=${Uri.encodeComponent(item.toString())}');
          }
        } else if (value is Map) {
          // Flatten amenities if map
          value.forEach((subKey, subValue) {
            if (subValue == true) {
              queryParts.add('$key.$subKey=true');
            }
          });
        } else {
          queryParts.add('$key=${Uri.encodeComponent(value.toString())}');
        }
      }
    });
    return queryParts.join('&');
  }

  Future<bool> addProperty(Map<String, dynamic> propertyData) async {
    try {
      final response = await _api.post('/api/properties', propertyData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        fetchProperties(); // Refresh
        return true;
      }
    } catch (e) {}
    return false;
  }

  Future<bool> updateProperty(String id, Map<String, dynamic> updates) async {
    try {
      final response = await _api.put('/api/properties/$id', updates);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final updated = RentalProperty.fromJson(data);
        final index = _properties.indexWhere((p) => p.id == id);
        if (index != -1) {
          _properties[index] = updated;
        }
        notifyListeners();
        return true;
      }
    } catch (e) {}
    return false;
  }

  Future<bool> deleteProperty(String id) async {
    try {
      final response = await _api.delete('/api/properties/$id');
      if (response.statusCode == 200 || response.statusCode == 204) {
        _properties.removeWhere((p) => p.id == id);
        notifyListeners();
        return true;
      }
    } catch (e) {}
    return false;
  }

  List<RentalProperty> getPropertiesByLandlord(String landlordId) {
    return _properties.where((p) => p.landlordId == landlordId).toList();
  }
}
