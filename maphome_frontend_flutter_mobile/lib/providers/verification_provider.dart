import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/verification_model.dart';
import '../services/api_service.dart';

class VerificationProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  
  List<VerificationRequest> _requests = [];
  bool _loading = false;

  List<VerificationRequest> get requests => _requests;
  bool get loading => _loading;

  Future<void> fetchRequests() async {
    _loading = true;
    notifyListeners();

    try {
      final res = await _api.get('/api/verifications');
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        _requests = data.map((json) => VerificationRequest.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching verification requests: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> addRequest(Map<String, dynamic> requestData) async {
    try {
      final response = await _api.post('/api/verifications', requestData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final newReq = VerificationRequest.fromJson(data);
        _requests.insert(0, newReq);
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Error adding verification request: $e');
    }
    return false;
  }

  Future<bool> updateRequestStatus(String requestId, String status) async {
    try {
      final response = await _api.put('/api/verifications/$requestId', {'status': status});
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final updated = VerificationRequest.fromJson(data);
        final index = _requests.indexWhere((r) => r.id == requestId);
        if (index != -1) {
          _requests[index] = updated;
        }
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Error updating verification status: $e');
    }
    return false;
  }

  Future<bool> completeInspection(String requestId, String badgeLevel, {String? notes}) async {
    try {
      final response = await _api.post('/api/verifications/$requestId/complete', {
        'badgeAwarded': badgeLevel,
        'inspectorNotes': notes ?? '',
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final updated = VerificationRequest.fromJson(data);
        final index = _requests.indexWhere((r) => r.id == requestId);
        if (index != -1) {
          _requests[index] = updated;
        }
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Error completing inspection: $e');
    }
    return false;
  }

  Future<bool> notifyUserAboutPhotos(String requestId) async {
    try {
      final response = await _api.post('/api/verifications/$requestId/notify', null);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final updated = VerificationRequest.fromJson(data);
        final index = _requests.indexWhere((r) => r.id == requestId);
        if (index != -1) {
          _requests[index] = updated;
        }
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Error notifying user: $e');
    }
    return false;
  }

  Future<bool> submitUserPhotos(String requestId, List<String> photos) async {
    try {
      final response = await _api.post('/api/verifications/$requestId/photos', {
        'photos': photos,
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final updated = VerificationRequest.fromJson(data);
        final index = _requests.indexWhere((r) => r.id == requestId);
        if (index != -1) {
          _requests[index] = updated;
        }
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Error submitting photos: $e');
    }
    return false;
  }

  List<VerificationRequest> getRequestsByLandlord(String landlordId) {
    return _requests.where((r) => r.landlordId == landlordId).toList();
  }

  List<VerificationRequest> getRequestsByProperty(String propertyId) {
    return _requests.where((r) => r.propertyId == propertyId).toList();
  }

  List<VerificationRequest> getRequestsByUser(String userId) {
    return _requests.where((r) => r.requesterType == 'user' && r.requesterId == userId).toList();
  }
}
