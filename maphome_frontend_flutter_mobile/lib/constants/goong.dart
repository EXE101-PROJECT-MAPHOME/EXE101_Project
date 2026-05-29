// Goong API key loaded at compile time via --dart-define=GOONG_API_KEY=your_key
const String goongApiKey = String.fromEnvironment('GOONG_API_KEY', defaultValue: '');

bool get useGoong => goongApiKey.isNotEmpty;
