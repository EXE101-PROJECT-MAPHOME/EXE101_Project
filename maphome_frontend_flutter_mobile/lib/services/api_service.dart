import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'http_client_factory.dart';
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Deployed API for testing. Change to your environment if needed.
  static const String baseUrl =
      'https://exe101project-maphome-api.up.railway.app';

  final http.Client _client = createPlatformClient();

  String? _token;
  String? _cookie;
  Function()? _onUnauthorized;

  void setUnauthorizedCallback(Function() callback) {
    _onUnauthorized = callback;
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    _cookie = prefs.getString('cookie');
  }

  Future<void> saveAuth(String token, String? cookie) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);

    if (cookie != null) {
      // Extract only the refreshToken segment
      final regExp = RegExp(r'(refreshToken=[^;]+)');
      final match = regExp.firstMatch(cookie);
      if (match != null) {
        _cookie = match.group(1);
        await prefs.setString('cookie', _cookie!);
      }
    }
  }

  Future<void> clearAuth() async {
    _token = null;
    _cookie = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('cookie');
    await prefs.remove('auth_user');
  }

  Map<String, String> _getHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    if (_cookie != null) {
      headers['Cookie'] = _cookie!;
    }
    return headers;
  }

  Future<http.Response> get(String path) async {
    final url = Uri.parse('$baseUrl$path');
    var response = await _client.get(url, headers: _getHeaders());

    if (response.statusCode == 401) {
      final refreshed = await _attemptTokenRefresh();
      if (refreshed) {
        response = await _client.get(url, headers: _getHeaders());
      }
    }
    return response;
  }

  Future<http.Response> post(String path, dynamic body) async {
    final url = Uri.parse('$baseUrl$path');
    final bodyStr = body != null ? jsonEncode(body) : null;
    var response = await _client.post(url, headers: _getHeaders(), body: bodyStr);

    if (response.statusCode == 401 && path != '/api/auth/login') {
      final refreshed = await _attemptTokenRefresh();
      if (refreshed) {
        response = await _client.post(url, headers: _getHeaders(), body: bodyStr);
      }
    }
    return response;
  }

  /// Simple health check to help diagnose connectivity/CORS issues.
  Future<bool> pingHealth() async {
    try {
      final url = Uri.parse('$baseUrl/health');
      final res = await _client.get(url, headers: {'Accept': 'application/json'});
      return res.statusCode == 200;
    } catch (e) {
      print('Health check failed: $e');
      return false;
    }
  }

  Future<http.Response> put(String path, dynamic body) async {
    final url = Uri.parse('$baseUrl$path');
    final bodyStr = body != null ? jsonEncode(body) : null;
    var response = await _client.put(url, headers: _getHeaders(), body: bodyStr);

    if (response.statusCode == 401) {
      final refreshed = await _attemptTokenRefresh();
      if (refreshed) {
        response = await _client.put(url, headers: _getHeaders(), body: bodyStr);
      }
    }
    return response;
  }

  Future<http.Response> delete(String path) async {
    final url = Uri.parse('$baseUrl$path');
    var response = await _client.delete(url, headers: _getHeaders());

    if (response.statusCode == 401) {
      final refreshed = await _attemptTokenRefresh();
      if (refreshed) {
        response = await _client.delete(url, headers: _getHeaders());
      }
    }
    return response;
  }

  Future<bool> _attemptTokenRefresh() async {
    if (_cookie == null) {
      _handleLogout();
      return false;
    }

    try {
      final url = Uri.parse('$baseUrl/api/auth/refresh');
      final response = await _client.get(
        url,
        headers: {'Content-Type': 'application/json', 'Cookie': _cookie!},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newToken = data['token'];
        if (newToken != null) {
          // Extract set-cookie if updated
          final newCookie = response.headers['set-cookie'];
          await saveAuth(newToken, newCookie);
          return true;
        }
      }
    } catch (e) {
      print('Token refresh failed: $e');
    }

    _handleLogout();
    return false;
  }

  void _handleLogout() {
    clearAuth();
    if (_onUnauthorized != null) {
      _onUnauthorized!();
    }
  }
}
