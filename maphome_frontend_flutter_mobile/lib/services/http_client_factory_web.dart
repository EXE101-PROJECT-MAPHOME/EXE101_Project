import 'package:http/browser_client.dart';
import 'package:http/http.dart' as http;

/// Web HTTP client factory — enables `withCredentials` so the browser
/// automatically sends/receives cookies on cross-origin requests.
/// This is required for the refresh-token cookie to work with the Railway API.
http.Client createPlatformClient() {
  final client = BrowserClient();
  client.withCredentials = true;
  return client;
}
