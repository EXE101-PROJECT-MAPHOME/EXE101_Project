// Goong API Keys
// Used for Geocoding, Directions, Places Autocomplete
const String goongApiKey = '9Xau7e646cReoQa17uHw6Dp1KLPG7ahl9iDGy8V1';

// Used ONLY for fetching Map Tiles (Raster/Vector maps)
const String goongMapTilesKey = 'zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF';

bool get useGoong => goongMapTilesKey.isNotEmpty;
