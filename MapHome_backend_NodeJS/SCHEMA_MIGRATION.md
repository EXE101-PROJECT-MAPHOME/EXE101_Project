# Property Schema Migration Guide

## Overview
The Property model has been updated to:
1. **Location**: Changed from plain array `[lng, lat]` to GeoJSON Point format for proper geospatial indexing
2. **Images**: Added support for multiple images via `images` array field

## Breaking Changes

### Before
```javascript
{
  location: [106.764, 10.856],        // Plain array [lng, lat]
  image: "https://example.com/img.jpg" // Single image
}
```

### After
```javascript
{
  location: {
    type: "Point",
    coordinates: [106.764, 10.856]     // GeoJSON format
  },
  image: "https://example.com/img.jpg", // Kept for backward compatibility
  images: [                              // New array of images
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg"
  ]
}
```

## Migration Steps

### Option 1: Automatic Conversion (Recommended)
Properties are automatically converted when:
- **Created**: Frontend sends `location: [lng, lat]` → Backend converts to GeoJSON
- **Updated**: Backend normalizes any location updates
- **Serialized**: GeoJSON is converted back to `[lng, lat]` array for frontend

**No action needed** - the system handles conversion automatically for new properties.

### Option 2: Manual Migration (For Existing Properties)
If you have existing properties in the database with the old format, run:

```javascript
// Node.js script to migrate existing properties
const mongoose = require('mongoose');
const Property = require('./src/models/Property');

// Connect to DB and run:
async function migrate() {
  const properties = await Property.find({ 'location.type': { $exists: false } });
  
  for (const prop of properties) {
    if (Array.isArray(prop.location) && prop.location.length >= 2) {
      prop.location = {
        type: "Point",
        coordinates: [prop.location[0], prop.location[1]]
      };
      
      // Also populate images array if not present
      if (!prop.images || prop.images.length === 0) {
        prop.images = prop.image ? [prop.image] : [];
      }
      
      await prop.save();
    }
  }
  
  console.log(`Migrated ${properties.length} properties`);
}

migrate();
```

## API Behavior

### Request Format
Frontend always sends location as array:
```json
{
  "location": [106.764, 10.856],
  "images": ["url1", "url2", "url3"]
}
```

### Response Format
Backend sends location as array (converted from GeoJSON):
```json
{
  "location": [106.764, 10.856],
  "image": "url1",
  "images": ["url1", "url2", "url3"]
}
```

## Geospatial Queries

All geospatial queries now work with GeoJSON format:

```javascript
// Search nearby properties
Property.find({
  location: {
    $nearSphere: {
      $geometry: {
        type: "Point",
        coordinates: [106.764, 10.856]  // [lng, lat]
      },
      $maxDistance: 5000  // meters
    }
  }
})
```

## Database Index
The `location` field has a 2dsphere index for efficient geospatial queries:
```javascript
PropertySchema.index({ location: "2dsphere" });
```

## Backward Compatibility

✅ **Automatic**:
- Old properties can still be read (getNearbyLandmarks handles both formats)
- New properties automatically use GeoJSON format
- Frontend receives consistent array format regardless of storage format

⚠️ **Not automatic**:
- Old properties won't benefit from optimized geospatial queries until migrated
- Recommend running Option 2 migration script on test environment first

## Testing Checklist

After migration, verify:
- [ ] Creating new properties stores location in GeoJSON format
- [ ] Searching nearby properties returns correct results
- [ ] Multiple images display correctly in UI
- [ ] Existing properties still render on map
- [ ] Landmark fetching works for both old and new location formats
- [ ] Verification distance calculations work correctly
