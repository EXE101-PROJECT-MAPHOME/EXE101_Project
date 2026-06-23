# 📱 MapHome Mobile App — Developer & Architecture Guide

Tài liệu hướng dẫn phát triển và cấu trúc ứng dụng di động dành cho lập trình viên (Developer). Dự án được xây dựng bằng **React Native, Expo (SDK 54) và NativeWind (TailwindCSS)**.

---

## 📊 TIẾN ĐỘ MOBILE APP (Mobile Progress)

> Cập nhật lần cuối: **23/06/2026**

### ✅ Đã hoàn thành

#### 📱 Màn hình chính (Tabs — app/(tabs)/)
| Màn hình | Mô tả |
|:---------|:------|
| `index.tsx` | Home: phòng nổi bật, voucher, blog, tìm kiếm nhanh |
| `map.tsx` | Bản đồ tương tác với GPS thời gian thực, marker phòng trọ, BottomSheet xem nhanh |
| `profile.tsx` | Hồ sơ cá nhân, đổi avatar, thông tin tài khoản |
| `saved.tsx` | Phòng trọ yêu thích đã lưu |
| `landlord-dashboard.tsx` | Dashboard quản lý phòng, lịch hẹn cho Landlord |
| `user-dashboard.tsx` | Dashboard lịch hẹn, giao dịch cho User |
| `broker-dashboard.tsx` | Dashboard quản lý leads và phòng cho Broker |
| `admin-dashboard.tsx` | Dashboard thống kê tổng quan cho Admin |
| `blog.tsx` | Danh sách bài viết cẩm nang |
| `contact.tsx` | Form liên hệ |
| `policy.tsx` | Chính sách sử dụng |

#### 📄 Màn hình khác (app/)
| Màn hình | Mô tả |
|:---------|:------|
| `post-room.tsx` | Đăng tin phòng trọ với chụp ảnh Camera và ghim bản đồ |
| `checkout.tsx` | Thanh toán gói dịch vụ + áp mã giảm giá |
| `payment-success.tsx` | Thông báo thanh toán thành công |
| `payment-failure.tsx` | Thông báo thanh toán thất bại |
| `verification-service.tsx` | Giới thiệu dịch vụ xác minh thực địa |
| `pricing.tsx` | Bảng giá gói đăng tin |
| `blog.tsx` | Danh sách bài viết |
| `contact.tsx` | Liên hệ |
| `onboarding.tsx` | Màn hình giới thiệu cho người dùng mới |
| `settings.tsx` | Cài đặt ứng dụng |
| `personal-info.tsx` | Chỉnh sửa thông tin cá nhân |
| `admin-voucher-add.tsx` | Thêm voucher mới (Admin) |
| `policy.tsx` | Chính sách sử dụng |
| `maintenance.tsx` | Màn hình bảo trì |
| `update.tsx` | Kiểm tra cập nhật ứng dụng |

#### 🔒 Màn hình xác thực (app/(auth)/)
- [x] Đăng nhập (email + mật khẩu)
- [x] Đăng ký tài khoản (chọn vai trò)
- [x] Quên mật khẩu (gửi email khôi phục)
- [x] Đăng nhập Google OAuth (expo-auth-session + expo-web-browser)

#### 🗂️ Chi tiết phòng trọ (app/room/)
- [x] `[id].tsx` — Trang chi tiết phòng động theo ID (ảnh slideshow, bản đồ, đặt lịch, xem tiện ích xung quanh)

#### 🧩 Components
- [x] `BookingModal.tsx` — Modal đặt lịch hẹn xem phòng dạng BottomSheet
- [x] `RoomMapPreview.tsx` — Bản đồ nhỏ hiển thị vị trí tĩnh của phòng trọ

#### 🗃️ State Management (Contexts)
- [x] `AuthContext` — Quản lý phiên đăng nhập, AsyncStorage, auto-restore khi mở app
- [x] `PropertiesContext` — Danh sách phòng trọ và bộ lọc
- [x] `CompareContext` — So sánh phòng trọ

#### 🚀 Deploy & Môi trường
- [x] File `.env` cấu hình `EXPO_PUBLIC_USE_LOCAL_BACKEND=false` để kết nối Railway
- [x] Tự động nhận diện môi trường giả lập (Android: `10.0.2.2`, iOS: `localhost`)
- [x] Hỗ trợ chạy trên thiết bị thật qua `EXPO_PUBLIC_LOCAL_API_URL` (mạng LAN)

---

## 🛠️ Technology Stack & Thư Viện Sử Dụng
- **Core:** React Native (v0.81) & Expo SDK 54
- **Routing:** Expo Router (Định tuyến dựa trên thư mục - File-based routing)
- **Styling:** NativeWind (cho phép viết các lớp TailwindCSS trực tiếp trong React Native)
- **Maps:** React Native Maps (`react-native-maps` dùng Google Maps trên Android và Apple Maps trên iOS)
- **Image Picker:** Expo Image Picker (chụp ảnh, chọn ảnh từ thư viện thiết bị)
- **Location:** Expo Location (GPS định vị thời gian thực)
- **Storage:** React Native AsyncStorage (lưu trữ token đăng nhập ngoại tuyến)
- **HTTP Client:** Axios (kết nối và trao đổi dữ liệu với backend API)
- **Gateway Payment:** React Native WebView (nhúng cổng thanh toán VNPay/PayOS)
- **Auth:** Firebase Auth + expo-auth-session (Google OAuth)

---

## 💼 Chi Tiết Các Nghiệp Vụ Cốt Lõi Trên Mobile App

### 🔑 1. Nghiệp Vụ Xác Thực & Đăng Nhập Trên Thiết Bị Di Động
- **Cơ chế hoạt động:**
  - Người dùng gửi thông tin đăng nhập từ form di động.
  - Thành công, token và thông tin profile được lưu trữ an toàn dưới bộ nhớ cục bộ bằng **`AsyncStorage`**.
  - Tích hợp **Google Sign-In**: Sử dụng thư viện `expo-auth-session` kết hợp với `expo-web-browser` để mở trình duyệt bảo mật của điện thoại làm cổng xác thực tài khoản Google.
  - Mỗi khi app khởi động lại, `AuthContext` đọc nhanh AsyncStorage để kiểm tra token còn hiệu lực hay không và tự động đăng nhập không cần hỏi lại.

### 📍 2. Nghiệp Vụ Định Vị Bản Đồ & Vị Trí Hiện Tại (GPS & Map Positioning)
- **Cơ chế hoạt động:**
  - Khi mở màn hình [map.tsx](./app/(tabs)/map.tsx), ứng dụng gọi thư viện `expo-location` gửi yêu cầu xin quyền định vị của hệ điều hành điện thoại (`Location.requestForegroundPermissionsAsync()`).
  - Nếu được cấp quyền, ứng dụng lấy tọa độ thời gian thực của GPS thiết bị và dịch chuyển camera bản đồ (`react-native-maps`) về vị trí hiện tại của người dùng.
  - Các marker phòng trọ được render liên tục. Khi người dùng bấm vào một marker, một Modal BottomSheet xuất hiện ở cạnh dưới màn hình hiển thị ảnh và tóm tắt thông tin phòng trọ.

### 📸 3. Nghiệp Vụ Đăng Bài & Tải Ảnh Bằng Camera Điện Thoại (Expo Image Picker)
- **Cơ chế hoạt động:**
  - Trong màn hình [post-room.tsx](./app/post-room.tsx), khi chủ nhà bấm thêm ảnh, app gọi API `ImagePicker.launchImageLibraryAsync` (hoặc `launchCameraAsync` nếu chọn chụp ảnh từ camera).
  - Thư viện cung cấp lựa chọn nhiều tệp ảnh (`allowsMultipleSelection: true`) và chỉnh chất lượng để giảm dung lượng file gửi đi.
  - Thông tin đường dẫn tạm (URI), định dạng (mime-type) và tên ảnh được đóng gói thành tệp tin nhị phân trong đối tượng `FormData`.
  - Gửi dữ liệu đa phần (Multipart request) đến máy chủ qua Axios Client, nhận về mảng link lưu trữ.

### 💳 4. Nghiệp Vụ Thanh Toán Qua Cầu Nối WebView (WebView Payment Bridge)
- **Cơ chế hoạt động:**
  - Do VNPay và PayOS không có SDK native hoàn toàn cho React Native, Mobile App sử dụng giải pháp **WebView Bridge**.
  - Khi chủ trọ thanh toán ở màn hình [checkout.tsx](./app/checkout.tsx), app nhận URL thanh toán từ Backend và hiển thị một component `<WebView source={{ uri: paymentUrl }} />` phủ kín màn hình.
  - Gắn sự kiện `onNavigationStateChange` vào WebView. Mỗi khi trang web chuyển hướng, ứng dụng kiểm tra địa chỉ URL hiện tại.
  - Khi phát hiện địa chỉ URL khớp với callback của backend, ứng dụng sẽ chặn hành vi tải trang, phân tích tham số kết quả giao dịch, tắt WebView và điều hướng người dùng về màn hình thông báo kết quả.

---

## 📂 Sơ Đồ Cấu Trúc Thư Mục (Directory Tree)

```text
MapHome_Frontend_Mobile_App_Expo/
├── app/                    # Thư mục định tuyến chính (Expo Router)
│   ├── (auth)/             # Nhóm màn hình Xác thực (Đăng nhập, Đăng ký, Quên mật khẩu)
│   ├── (tabs)/             # Nhóm màn hình Tab Bar chính (Home, Map, Profile, Dashboards)
│   │   ├── index.tsx       # Màn hình Home chính
│   │   ├── map.tsx         # Màn hình Bản đồ tìm kiếm phòng trọ
│   │   ├── profile.tsx     # Màn hình Hồ sơ người dùng
│   │   ├── saved.tsx       # Phòng yêu thích
│   │   ├── landlord-dashboard.tsx  # Dashboard chủ nhà
│   │   ├── user-dashboard.tsx      # Dashboard khách thuê
│   │   ├── broker-dashboard.tsx    # Dashboard môi giới
│   │   └── admin-dashboard.tsx     # Dashboard quản trị viên
│   ├── blog/               # Chi tiết bài viết Blog
│   ├── role/               # Các trang lựa chọn vai trò (chủ trọ/khách thuê)
│   ├── room/
│   │   └── [id].tsx        # Chi tiết phòng trọ động
│   ├── _layout.tsx         # Root layout cấu hình Navigation, Font và Auth Context wrapper
│   ├── checkout.tsx        # Trang thanh toán gói dịch vụ
│   ├── post-room.tsx       # Giao diện đăng bài và ghim tọa độ
│   ├── onboarding.tsx      # Màn hình giới thiệu người dùng mới
│   └── ...                 # Các màn hình khác (pricing, contact, settings...)
├── components/             # Các thành phần giao diện nhỏ dùng chung
│   ├── ui/                 # Icon, Collapsible components bổ trợ
│   ├── BookingModal.tsx    # Modal đặt lịch hẹn xem phòng dạng BottomSheet
│   └── RoomMapPreview.tsx  # Bản đồ nhỏ hiển thị vị trí tĩnh của phòng trọ
├── contexts/               # Quản lý trạng thái toàn cục di động (Auth, Properties, Compare)
├── utils/
│   └── api.ts              # Axios client tập trung, tự động chọn URL Local/Deploy
├── constants/              # Hằng số, routes, màu sắc
├── package.json            # Liệt kê thư viện phụ thuộc và các scripts chạy Expo
└── tsconfig.json           # Cấu hình TypeScript cho dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Phát Triển (Local Setup)

### 1. Cài đặt các gói thư viện
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc của mobile app:
```dotenv
# true = Backend Local | false = Railway deploy (khuyên dùng)
EXPO_PUBLIC_USE_LOCAL_BACKEND=false

EXPO_PUBLIC_API_URL=https://exe101project-maphome-api.up.railway.app

# IP máy tính cá nhân khi kiểm thử trên điện thoại thật (Mạng LAN)
# Ví dụ: EXPO_PUBLIC_LOCAL_API_URL=http://192.168.1.15:5000
EXPO_PUBLIC_LOCAL_API_URL=

EXPO_PUBLIC_GOOGLE_CLIENT_ID=817734182215-ijh0r2a1fbcsm5u5nams9e92obh5cmck.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=817734182215-0bmgjcggm7k7h0qice3lff1dr7s3q638.apps.googleusercontent.com
EXPO_PUBLIC_GOONG_MAPTILES_KEY=zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF
```

### 3. Cơ chế tự động định tuyến API (`utils/api.ts`)
- **`EXPO_PUBLIC_USE_LOCAL_BACKEND=false`** (khuyên dùng): Gọi thẳng Railway API.
- **`EXPO_PUBLIC_USE_LOCAL_BACKEND=true`**: Tự động nhận dạng môi trường:
  - **Android Emulator:** Ánh xạ `localhost` → `http://10.0.2.2:5000`
  - **iOS Simulator:** Kết nối trực tiếp `http://localhost:5000`
  - **Thiết bị thật (Expo Go):** Dùng `EXPO_PUBLIC_LOCAL_API_URL` (IP mạng LAN)

### 4. Chạy dự án
```bash
# Khởi động Expo Server
npm start

# Hoặc chạy và làm sạch cache (khuyên dùng khi cập nhật thư viện hoặc biến môi trường)
npx expo start -c
```
*Sau khi chạy, quét mã QR hiển thị bằng ứng dụng **Expo Go** trên điện thoại Android hoặc ứng dụng Camera mặc định trên iOS để trải nghiệm.*

### 5. Chạy trên giả lập
```bash
# Android Emulator (cần Android Studio)
npx expo run:android

# iOS Simulator (cần Xcode, chỉ macOS)
npx expo run:ios
```
