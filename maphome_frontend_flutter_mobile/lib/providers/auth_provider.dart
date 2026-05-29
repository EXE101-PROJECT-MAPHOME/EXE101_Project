import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  UserModel? _user;
  bool _loading = false;

  UserModel? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _api.setUnauthorizedCallback(_onSessionExpired);
    _loadPersistedUser();
  }

  void _onSessionExpired() {
    _user = null;
    notifyListeners();
  }

  Future<void> _loadPersistedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('auth_user');
    if (userJson != null) {
      try {
        _user = UserModel.fromJson(jsonDecode(userJson));
        notifyListeners();
      } catch (e) {
        print('Error parsing persisted user: $e');
      }
    }
    // Fetch fresh profile in the background if possible
    checkProfile();
  }

  Future<void> checkProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) return;

    try {
      final res = await _api.get('/api/users/me');
      if (res.statusCode == 200) {
        final userData = jsonDecode(res.body);
        _user = UserModel.fromJson(userData);
        await prefs.setString('auth_user', jsonEncode(userData));
        notifyListeners();
      }
    } catch (e) {
      print('Error fetching profile: $e');
    }
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.post('/api/auth/login', {
        'usernameOrEmail': username,
        'password': password,
      });

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = data['token'];
        final userMap = data['user'];

        final setCookie = response.headers['set-cookie'];
        await _api.saveAuth(token, setCookie);

        _user = UserModel.fromJson(userMap);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_user', jsonEncode(userMap));

        _loading = false;
        notifyListeners();
        return {'success': true, 'role': _user?.role};
      } else {
        _loading = false;
        notifyListeners();
        return {
          'success': false,
          'message': data['message'] ?? 'Đăng nhập thất bại',
        };
      }
    } catch (e) {
      _loading = false;
      notifyListeners();

      // Try a quick health check to provide a more actionable message
      try {
        final healthy = await _api.pingHealth();
        if (!healthy) {
          return {
            'success': false,
            'message':
                'Không thể kết nối tới server (health check failed). Kiểm tra server hoặc mạng.',
          };
        }
      } catch (_) {
        // ignore
      }

      final msg = e.toString();
      if (msg.contains('Failed to fetch') || msg.contains('XMLHttpRequest')) {
        return {
          'success': false,
          'message':
              'Lỗi kết nối máy chủ (CORS hoặc mạng). Mở https://exe101project-maphome-api.up.railway.app/api-docs để kiểm tra.',
        };
      }

      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required String role,
  }) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.post('/api/auth/register', {
        'username': username,
        'email': email,
        'password': password,
        'confirmPassword': password,
        'fullName': fullName,
        'phone': phone,
        'role': role,
      });

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = data['token'];
        final userMap = data['user'];
        final setCookie = response.headers['set-cookie'];
        await _api.saveAuth(token, setCookie);

        _user = UserModel.fromJson(userMap);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_user', jsonEncode(userMap));

        _loading = false;
        notifyListeners();
        return {'success': true};
      } else {
        _loading = false;
        notifyListeners();
        return {
          'success': false,
          'message': data['message'] ?? 'Đăng ký thất bại',
        };
      }
    } catch (e) {
      _loading = false;
      notifyListeners();
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<void> logout() async {
    try {
      await _api.post('/api/auth/logout', null);
    } catch (e) {
      print('Logout API error: $e');
    }
    await _api.clearAuth();
    _user = null;
    notifyListeners();
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _api.post('/api/auth/forgot-password', {
        'email': email,
      });
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Mã xác thực đã được gửi!',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Gửi yêu cầu thất bại',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<Map<String, dynamic>> verifyResetCode(
    String email,
    String token,
  ) async {
    try {
      final response = await _api.post('/api/auth/verify-reset-code', {
        'email': email,
        'token': token,
      });
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Mã xác nhận không hợp lệ',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<Map<String, dynamic>> resetPassword(
    String email,
    String token,
    String newPassword,
  ) async {
    try {
      final response = await _api.post('/api/auth/reset-password', {
        'email': email,
        'token': token,
        'newPassword': newPassword,
        'confirmPassword': newPassword,
      });
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Đặt lại mật khẩu thất bại',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<Map<String, dynamic>> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    try {
      final response = await _api.put('/api/auth/change-password', {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': newPassword,
      });
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        // Log out user after successful password change
        await logout();
        return {'success': true};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Thay đổi mật khẩu thất bại',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  void updateUser(UserModel updatedUser) {
    _user = updatedUser;
    notifyListeners();
  }
}
