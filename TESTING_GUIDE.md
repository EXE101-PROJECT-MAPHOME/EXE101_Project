# Quick Start Testing Guide

## 1. Restart Backend Server

```bash
cd MapHome_backend_NodeJS
npm start
```

Expected output:
```
✔ Server running on port 5000
✔ MongoDB connected to MapHome
```

---

## 2. Test 1: Create New Property

**Steps:**
1. Open MapHome Frontend (http://localhost:5173)
2. Login as landlord
3. Go to "Đăng tin" (Post Room)
4. Fill form:
   - Name: "Test Phòng Trọ"
   - Price: 3,000,000
   - Area: 25
   - Upload 3+ images
   - Pin location on map
5. Click "Đăng tin"

**Expected Results:**
- ✅ Property created successfully
- ✅ No database errors
- ✅ Toast: "Đăng tin thành công! ✨"
- ✅ Redirects to landlord dashboard

**Verify in Database (MongoDB):**
```javascript
// Open MongoDB Compass or shell
db.properties.findOne({ name: "Test Phòng Trọ" })

// Expected output:
{
  _id: ObjectId("..."),
  name: "Test Phòng Trọ",
  location: {
    type: "Point",
    coordinates: [106.764, 10.856]   // ← GeoJSON format
  },
  image: "https://...",
  images: ["https://...", "https://...", "..."],  // ← Multiple images
  status: "approved"                              // ← Auto-approved!
}
```

---

## 3. Test 2: View Property on Map

**Steps:**
1. Go to Map page
2. Should immediately see the new property
3. Click on the property marker

**Expected Results:**
- ✅ Property appears on map immediately (no admin approval needed!)
- ✅ Popup shows property details
- ✅ Popup shows first image from `images` array
- ✅ "Xem chi tiết" button works
- ✅ No console errors about "poi-tree" layer

**Check Console:**
- ✅ No "Source layer trees does not exist" errors
- ✅ You may see "Map style layer error (non-critical)" as warning

---

## 4. Test 3: Search by Location

**Steps:**
1. On Map page, click "Tìm gần" (Search Nearby)
2. Select a workplace or location
3. Should filter properties nearby

**Expected Results:**
- ✅ Geospatial search works
- ✅ Only properties within radius shown
- ✅ Distance displayed correctly
- ✅ No database query errors

**Check Backend Logs:**
- Look for successful geospatial query execution

---

## 5. Test 4: Property Details

**Steps:**
1. View property detail page
2. Scroll to images section

**Expected Results:**
- ✅ All images from `images` array display
- ✅ Can see multiple photos (slider/gallery)
- ✅ Load time is reasonable

---

## 6. Test 5: Landmark Fetching

**Steps:**
1. View property detail page
2. Scroll to "Địa điểm gần đây" (Nearby Places) section

**Expected Results:**
- ✅ Landmarks fetch correctly
- ✅ Shows universities, schools, hospitals, parks nearby
- ✅ Displays distance (km or m)
- ✅ No errors in console

---

## 7. Test 6: Search Properties

**Steps:**
1. Use search bar on map or filter panel
2. Try different filters (price, area, amenities)
3. Try text search

**Expected Results:**
- ✅ All filters work
- ✅ Text search returns matching properties
- ✅ Results appear instantly
- ✅ No "Invalid location" errors

---

## 8. Verify Backward Compatibility

**Steps:**
1. Check if any old properties still exist in database
2. View them on the map or search results

**Expected Results:**
- ✅ Old properties with `location: [lng, lat]` format still work
- ✅ They can be viewed and searched
- ✅ No errors when loading

---

## 9. Admin Verification (Optional)

**Steps:**
1. Create property with GPS verification
2. Pin location on map
3. Accept GPS verification request
4. Check distance calculation

**Expected Results:**
- ✅ Distance calculated correctly using new coordinates
- ✅ Verification badge awarded if distance < 50m
- ✅ No errors in verification process

---

## Troubleshooting

### Error: "Invalid location format"
- **Cause**: Location not sent properly
- **Fix**: Check that frontend sends `location: [lng, lat]` array

### Error: "Cannot read property 'coordinates' of undefined"
- **Cause**: Old data or serialization issue
- **Fix**: Ensure serialization function is in place

### Properties not appearing on map
- **Cause**: Still `status: "pending"`
- **Fix**: Check if `payload.status = "approved"` is in createProperty

### Multiple images not showing
- **Cause**: Images array not populated
- **Fix**: Check normalizeImages function is being called

### Geospatial queries fail
- **Cause**: Location index issue or mixed formats
- **Fix**: Run `db.properties.reIndex()` in MongoDB

---

## Database Queries

### Check new property format:
```javascript
db.properties.findOne({ 
  "location.type": "Point" 
})
```

### Count new vs old format:
```javascript
db.properties.countDocuments({ "location.type": "Point" })      // New format
db.properties.countDocuments({ "location.type": { $exists: false } })  // Old format
```

### Find properties near coordinate:
```javascript
db.properties.find({
  location: {
    $nearSphere: {
      $geometry: { type: "Point", coordinates: [106.764, 10.856] },
      $maxDistance: 5000  // 5km in meters
    }
  }
}).limit(10)
```

---

## Cleanup After Testing

If you want to remove test properties:
```javascript
db.properties.deleteMany({ name: "Test Phòng Trọ" })
```

---

## Success Criteria ✅

All of the following should be true:
- [ ] New properties created with GeoJSON location format
- [ ] New properties have `images` array populated
- [ ] New properties auto-approve (`status: "approved"`)
- [ ] Properties appear on map immediately
- [ ] Geospatial searches work correctly
- [ ] Multiple images display in UI
- [ ] No console errors about map styling
- [ ] Old properties still work (if any exist)
- [ ] No database errors in logs

If all criteria are met, the implementation is successful! 🎉
