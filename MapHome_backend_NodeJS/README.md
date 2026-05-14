# MapHome Backend API

Node.js + Express + MongoDB backend for MapHome.

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create `.env`

```dotenv
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster1
DB_NAME=MapHome
JWT_SECRET=your_secret
PORT=5000

# Email Config (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```

3. Run

```bash
npm run dev
```

## Main API Groups

- Auth: `/api/auth`
- Users & Favorites: `/api/users`
- Properties: `/api/properties`
- Landlords: `/api/landlords`
- Verifications: `/api/verifications`
- Bookings: `/api/bookings`
- Payments: `/api/payments`
- Uploads: `/api/uploads`
- Admin stats: `/api/admin`

## Auth Header

Use JWT token for protected endpoints:

```http
Authorization: Bearer <token>
```

## Notable Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/me`
- `GET /api/users/me/favorites`
- `POST /api/users/me/favorites/toggle`
- `GET /api/properties`
- `GET /api/properties/nearby?lat=10.77&lng=106.69&radiusKm=5`
- `POST /api/properties/:id/favorite`
- `POST /api/properties/:id/view`
- `GET /api/verifications?landlordId=<id>&status=pending`
- `POST /api/verifications/:id/photos`
- `POST /api/verifications/:id/complete`
- `POST /api/bookings`
- `POST /api/uploads/single` (form-data key: `image`)
- `POST /api/uploads/multiple` (form-data key: `images`)
- `GET /api/admin/stats`

## Notes

- VNPay integration is currently a stub response in `paymentController`.
- Local file uploads are stored under `uploads/` and served at `/uploads/<filename>`.

### Cấu hình Email (Quên mật khẩu)
Dự án sử dụng `nodemailer` để gửi mật khẩu mới qua Gmail. Để tính năng này hoạt động khi bạn chạy dự án (Test), bạn có 2 lựa chọn:

#### Lựa chọn 1: Dùng chung cấu hình của Chủ dự án (Nhanh nhất)
Nếu bạn được chủ dự án cung cấp thông tin, hãy dán trực tiếp vào file `.env`:
- `EMAIL_USER`: [Email của chủ dự án]
- `EMAIL_PASS`: [Mã 16 ký tự của chủ dự án]

#### Lựa chọn 2: Tự cấu hình bằng Gmail cá nhân
1. Bật **Xác minh 2 bước** cho tài khoản Gmail của bạn.
2. Tạo **Mật khẩu ứng dụng (App Password)**:
   - Vào tài khoản Google -> Bảo mật -> Tìm kiếm "Mật khẩu ứng dụng".
   - Chọn ứng dụng "Thư" và thiết bị "Máy tính Windows".
   - Copy mã 16 ký tự hiện ra.
3. Cập nhật file `.env`:
   - `EMAIL_USER`: Địa chỉ Gmail của bạn.
   - `EMAIL_PASS`: Mã 16 ký tự vừa copy (viết liền, không dấu cách).

