import 'package:flutter/material.dart';
import '../models/property_model.dart';

class CompareProvider extends ChangeNotifier {
  final List<RentalProperty> _compareList = [];

  List<RentalProperty> get compareList => _compareList;

  void addToCompare(RentalProperty property) {
    if (_compareList.length >= 4) {
      return;
    }
    if (_compareList.any((p) => p.id == property.id)) {
      return;
    }
    _compareList.add(property);
    notifyListeners();
  }

  void removeFromCompare(String propertyId) {
    _compareList.removeWhere((p) => p.id == propertyId);
    notifyListeners();
  }

  void clearCompare() {
    _compareList.clear();
    notifyListeners();
  }

  bool isInCompare(String propertyId) {
    return _compareList.any((p) => p.id == propertyId);
  }
}
