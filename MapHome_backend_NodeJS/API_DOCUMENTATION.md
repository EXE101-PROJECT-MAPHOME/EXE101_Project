# MapHome Backend API Documentation

Complete API reference for MapHome backend (Node.js + Express + MongoDB).

## Quick Start

```bash
# Install
npm install

# Run (development)
npm run dev

# Run (production)
npm start
```

## Environment Setup

Create `.env`:

```dotenv
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster1&retryWrites=true&w=majority
DB_NAME=MapHome
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

## Authentication & Authorization

### Get Token (Login)

```bash
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "role": "user|landlord|admin",
    "fullName": "...",
    "phone": "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Use Token

All protected endpoints require header:

```
Authorization: Bearer <token>
```

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Full Name",
  "phone": "0123456789",
  "role": "user" or "landlord"
}
```

---

## Properties API

### Get All Properties

```
GET /api/properties
```

**Query Parameters (optional):**

- `name`: Search by name/address
- `minPrice`, `maxPrice`: Price range
- `minArea`, `maxArea`: Area range
- `available`: true/false

**Example:**

```
GET /api/properties?name=room&minPrice=2000000&maxPrice=5000000&available=true
```

### Get Nearby Properties

```
GET /api/properties/nearby?lat=10.7&lng=106.6&radiusKm=5
```

Returns properties within radius (uses Haversine formula).

### Get Single Property

```
GET /api/properties/:id
```

### Create Property (Auth required)

```bash
POST /api/properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Room A",
  "address": "123 Street, District 1, Ho Chi Minh",
  "price": 3000000,
  "area": 25,
  "location": [10.7, 106.6],
  "ownerName": "Landlord Name",
  "phone": "0123456789",
  "amenities": {
    "wifi": true,
    "furniture": true,
    "tv": false,
    "washingMachine": true,
    "kitchen": true,
    "refrigerator": true,
    "airConditioner": true
  },
  "image": "https://...",
  "available": true
}
```

**Requires:** Role = `landlord` or `admin`

### Update Property

```bash
PUT /api/properties/:id
Authorization: Bearer <token>
Content-Type: application/json

{ ...updated fields }
```

**Requires:** Role = `landlord` or `admin`

### Delete Property

```bash
DELETE /api/properties/:id
Authorization: Bearer <token>
```

**Requires:** Role = `landlord` or `admin`

### Add/Remove Favorite

```bash
POST /api/properties/:id/favorite
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "add" or "remove"
}
```

### Increment View Count

```
POST /api/properties/:id/view
```

---

## Users API

### Get My Profile

```bash
GET /api/users/me
Authorization: Bearer <token>
```

### Get User by ID

```bash
GET /api/users/:id
Authorization: Bearer <token>
```

**Note:** Only returns self or admin access.

### Update User

```bash
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "phone": "0987654321",
  "avatar": "https://..."
}
```

### Get My Favorites

```bash
GET /api/users/me/favorites
Authorization: Bearer <token>
```

### Toggle Favorite

```bash
POST /api/users/me/favorites/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "61a7f8e4b2c1234567890abc"
}
```

---

## Bookings API

### Get All Bookings

```bash
GET /api/bookings
Authorization: Bearer <token>
```

**Query Parameters:**

- `propertyId`: Filter by property
- `userId`: Filter by user
- `landlordId`: Filter by landlord
- `status`: pending, confirmed, cancelled, completed

**Example:**

```
GET /api/bookings?propertyId=61a7f8e4b2c&status=pending
```

**Requires:** Role = `admin` or `landlord`

### Get Booking Details

```bash
GET /api/bookings/:id
Authorization: Bearer <token>
```

### Create Booking

```bash
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "61a7f8e4b2c1234567890abc",
  "customerName": "John Doe",
  "customerPhone": "0123456789",
  "bookingDate": "2026-03-25",
  "bookingTime": "14:00",
  "note": "Please prepare room key"
}
```

**Auto-fills:** `userId` from token for user role

### Update Booking

```bash
PUT /api/bookings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Requires:** Role = `admin` or `landlord`

### Cancel Booking

```bash
DELETE /api/bookings/:id
Authorization: Bearer <token>
```

**Requires:** Role = `admin` or `landlord`

---

## Verifications API

### Get All Verification Requests

```bash
GET /api/verifications
Authorization: Bearer <token>
```

**Query Parameters:**

- `landlordId`: Filter by landlord
- `propertyId`: Filter by property
- `status`: pending, approved, awaiting_photos, photos_submitted, completed, rejected
- `requesterId`: Filter by requester

**Requires:** Role = `admin` or `landlord`

### Get Verification Details

```bash
GET /api/verifications/:id
Authorization: Bearer <token>
```

### Create Verification Request

```bash
POST /api/verifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "61a7f8e4b2c1234567890abc",
  "propertyName": "Room A",
  "landlordId": "61a7f8e4b2c1234567890def",
  "landlordName": "Landlord Name",
  "phone": "0123456789",
  "address": "123 Street",
  "scheduledDate": "2026-03-25",
  "scheduledTime": "09:00",
  "requesterType": "landlord" or "user",
  "requesterId": "61a7f8e4b2c1234567890ghi",
  "requesterName": "Requester Name",
  "requesterPhone": "0987654321"
}
```

### Update Verification

```bash
PUT /api/verifications/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "notes": "Additional notes"
}
```

**Requires:** Role = `admin` or `landlord`

### Notify User to Submit Photos

```bash
POST /api/verifications/:id/notify
Authorization: Bearer <token>
```

Changes status to `awaiting_photos` and sets `notifiedAt` timestamp.

**Requires:** Role = `admin` or `landlord`

### User Submits Photos

```bash
POST /api/verifications/:id/photos
Authorization: Bearer <token>
Content-Type: application/json

{
  "photos": [
    "/uploads/1234567890-photo1.jpg",
    "/uploads/1234567890-photo2.jpg"
  ]
}
```

Changes status to `photos_submitted` and sets `photosSubmittedAt`.

### Complete Inspection

```bash
POST /api/verifications/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "badgeAwarded": "verified",
  "inspectorNotes": "Property meets all requirements"
}
```

**Requires:** Role = `admin`

### Delete Verification

```bash
DELETE /api/verifications/:id
Authorization: Bearer <token>
```

**Requires:** Role = `admin`

---

## Landlords API

### Get All Landlords

```
GET /api/landlords
```

### Get Landlord Details

```
GET /api/landlords/:id
```

### Create Landlord (Admin only)

```bash
POST /api/landlords
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Landlord Name",
  "phone": "0123456789",
  "email": "landlord@example.com",
  "avatar": "https://...",
  "verified": true
}
```

**Requires:** Role = `admin`

### Update Landlord

```bash
PUT /api/landlords/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "rating": 4.5,
  "responseRate": 95
}
```

**Requires:** Role = `admin` or `landlord`

### Delete Landlord (Admin only)

```bash
DELETE /api/landlords/:id
Authorization: Bearer <token>
```

**Requires:** Role = `admin`

---

## Image Upload API

### Upload Single Image

```bash
POST /api/uploads/single
Authorization: Bearer <token>
Content-Type: multipart/form-data

[file part named 'image']
```

**Supported formats:** JPEG, PNG, GIF, WebP
**Max size:** 5MB

**Response:**

```json
{
  "fileName": "1234567890-photo.jpg",
  "originalName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 204800,
  "url": "/uploads/1234567890-photo.jpg"
}
```

### Upload Multiple Images

```bash
POST /api/uploads/multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data

[file parts named 'images', max 10 files]
```

**Response:** Array of upload objects

**Access uploaded file:**

```
http://localhost:5000/uploads/filename.jpg
```

---

## Admin API

### Get Dashboard Stats

```bash
GET /api/admin/stats
Authorization: Bearer <token>
```

**Requires:** Role = `admin`

**Response:**

```json
{
  "totalProperties": 42,
  "totalUsers": 156,
  "totalLandlords": 28,
  "totalVerifications": 89,
  "totalBookings": 234,
  "pendingVerifications": 12,
  "completedVerifications": 77,
  "pendingBookings": 18
}
```

---

## Payment API (VNPay stub)

### Create Payment

```bash
POST /api/payments/create
Content-Type: application/json

{
  "amount": 199000,
  "description": "Inspection fee",
  "orderId": "MH20260320123456"
}
```

**Response:**

```json
{
  "url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

### Payment Callback

```
GET /api/payments/callback?vnp_ResponseCode=00&...
```

_Note: Full VNPay integration (signature verification) needed for production._

---

## Error Responses

### 400 Bad Request

```json
{
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "message": "No token provided"
}
```

### 403 Forbidden

```json
{
  "message": "Forbidden"
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal Server Error"
}
```

---

## Health Check

```bash
GET /api/health
```

**Response:**

```json
{
  "ok": true
}
```

---

## Database Models

### User

- `username`: String (unique)
- `email`: String (unique)
- `password`: String (hashed)
- `fullName`: String
- `phone`: String
- `role`: enum (user, landlord, admin)
- `verificationLevel`: Number
- `favorites`: [ObjectId] (Property references)
- `createdAt`, `updatedAt`

### Property

- `name`: String
- `address`: String
- `price`: Number
- `area`: Number
- `location`: [longitude, latitude]
- `amenities`: Object
- `image`: String
- `available`: Boolean
- `ownerName`: String
- `phone`: String
- `views`: Number
- `favorites`: Number
- `landlordId`: ObjectId (Landlord reference)
- `createdAt`, `updatedAt`

### Booking

- `propertyId`: ObjectId (required)
- `userId`: ObjectId
- `landlordId`: ObjectId
- `customerName`: String (required)
- `customerPhone`: String (required)
- `bookingDate`: Date
- `bookingTime`: String
- `status`: enum (pending, confirmed, cancelled, completed)
- `note`: String
- `createdAt`, `updatedAt`

### VerificationRequest

- `propertyId`: ObjectId (required)
- `landlordId`: ObjectId (required)
- `scheduledDate`: Date
- `scheduledTime`: String
- `status`: enum (pending, approved, awaiting_photos, photos_submitted, completed, rejected)
- `userProvidedPhotos`: [String]
- `badgeAwarded`: String
- `inspectorNotes`: String
- `requesterType`: enum (landlord, user)
- `requesterId`: String
- `createdAt`, `updatedAt`

### Landlord

- `name`: String (required)
- `phone`: String (required)
- `email`: String (required, unique)
- `avatar`: String
- `totalListings`: Number
- `rating`: Number
- `responseRate`: Number
- `responseTime`: String
- `verified`: Boolean
- `joinedDate`: Date
- `createdAt`, `updatedAt`

---

## Testing Tools

### cURL Examples

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"testuser","password":"password123"}'
```

**Get Properties:**

```bash
curl http://localhost:5000/api/properties
```

**Upload Image:**

```bash
curl -X POST http://localhost:5000/api/uploads/single \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### Postman Import

Use the endpoints listed above in Postman. Create environment variable:

- `{{token}}`: JWT token from login response
- `{{baseUrl}}`: http://localhost:5000

---

## Deployment Notes

1. Set `NODE_ENV=production` in `.env`
2. Update VNPay credentials for production
3. Use environment-variable-based image storage (AWS S3, Cloudinary) instead of local disk
4. Enable HTTPS for all endpoints
5. Set up proper JWT secret management (use env var or secrets manager)
6. Configure CORS appropriately for frontend domain
7. Add rate limiting middleware for auth endpoints
8. Set up MongoDB backups

---

## Support & Issues

For issues, please check:

1. Database connection status (check MongoDB Atlas)
2. JWT token validity
3. User role permissions for protected endpoints
4. Network/firewall settings for uploads

---


## Subscriptions API [NEW]

### Get My Subscription

`GET /api/subscriptions/me`
(Requires Auth)

### Get Available Plans

`GET /api/subscriptions/plans`

### Subscribe

`POST /api/subscriptions/subscribe`
(Requires Auth)

Body: `{ "planId": "standard" | "pro" }`

---

## Transactions API [NEW]

### Get My Transactions

`GET /api/transactions/me`
(Requires Auth)
