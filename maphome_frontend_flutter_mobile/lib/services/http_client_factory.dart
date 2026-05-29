import 'package:http/http.dart' as http;

/// Default (mobile/desktop) HTTP client factory.
/// On mobile, a standard IOClient is used — no special config needed.
http.Client createPlatformClient() => http.Client();
