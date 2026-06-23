# 📱 MapHome Mobile App — Developer & Architecture Guide

Tài liệu hướng dẫn phát triển và cấu trúc ứng dụng di động dành cho lập trình viên (Developer). Dự án được xây dựng bằng **React Native, Expo (SDK 54) và NativeWind (TailwindCSS)**.

---

## 🛠️ Technology Stack & Thư Viện Sử Dụng
- **Core:** React Native (v0.81) & Expo SDK 54
- **Routing:** Expo Router (Định tuyến dựa trên thư mục - File-based routing)
- **Styling:** NativeWind (cho phép viết các lớp TailwindCSS trực tiếp trong React Native)
- **Maps:** React Native Maps (`react-native-maps` dùng Google Maps trên Android và Apple Maps trên iOS)
- **Image Picker:** Expo Image Picker (chụp ảnh, chọn ảnh từ thư viện thiết bị)
- **Storage:** React Native AsyncStorage (lưu trữ token đăng nhập ngoại tuyến)
- **HTTP Client:** Axios (kết nối và trao đổi dữ liệu với backend API)
- **Gateway Payment:** React Native WebView (nhúng cổng thanh toán VNPay/PayOS)

---

## 💼 Chi Tiết Các Nghiệp Vụ Cốt Lõi Trên Mobile App

Dưới đây là cách ứng dụng di động hiện thực hóa các luồng nghiệp vụ đặc thù bằng phần cứng di động:

### 🔑 1. Nghiệp Vụ Xác Thực & Đăng Nhập Trên Thiết Bị Di Động
- **Cơ chế hoạt động:** 
  - Người dùng gửi thông tin đăng nhập từ form di động. 
  - Thành công, token và thông tin profile được lưu trữ an toàn dưới bộ nhớ cục bộ bằng **`AsyncStorage`**.
  - Tích hợp **Google Sign-In**: Sử dụng thư viện `expo-auth-session` kết hợp với `expo-web-browser` để mở trình duyệt bảo mật của điện thoại làm cổng xác thực tài khoản Google. Client lấy mã xác thực trả về chuyển cho Backend tạo phiên làm việc.
  - Mỗi khi app khởi động lại, `AuthContext` đọc nhanh AsyncStorage để kiểm tra token còn hiệu lực hay không và tự động đăng nhập không cần hỏi lại.

### 📍 2. Nghiệp Vụ Định Vị Bản Đồ & Vị Trí Hiện Tại (GPS & Map Positioning)
- **Cơ chế hoạt động:**
  - Khi mở màn hình [map.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend_Mobile_App_Expo/app/(tabs)/map.tsx), ứng dụng gọi thư viện `expo-location` gửi yêu cầu xin quyền định vị của hệ điều hành điện thoại (`Location.requestForegroundPermissionsAsync()`).
  - Nếu được cấp quyền, ứng dụng lấy tọa độ thời gian thực của GPS thiết bị và dịch chuyển camera bản đồ (`react-native-maps`) về vị trí hiện tại của người dùng.
  - Các marker phòng trọ được render liên tục. Khi người dùng bấm vào một marker, một Modal BottomSheet xuất hiện ở cạnh dưới màn hình hiển thị ảnh và tóm tắt thông tin phòng trọ để khách hàng bấm xem chi tiết mà không làm mất góc nhìn bản đồ.

### 📸 3. Nghiệp Vụ Đăng Bài & Tải Ảnh Bằng Camera Điện Thoại (Expo Image Picker)
- **Cơ chế hoạt động:**
  - Trong màn hình [post-room.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend_Mobile_App_Expo/app/post-room.tsx), khi chủ nhà bấm thêm ảnh, app gọi API `ImagePicker.launchImageLibraryAsync` (hoặc `launchCameraAsync` nếu chọn chụp ảnh từ camera).
  - Thư viện cung cấp lựa chọn nhiều tệp ảnh (`allowsMultipleSelection: true`) và chỉnh chất lượng để giảm dung lượng file gửi đi.
  - Thông tin đường dẫn tạm (URI), định dạng (mime-type) và tên ảnh được đóng gói thành tệp tin nhị phân trong đối tượng `FormData`.
  - Gửi dữ liệu đa phần (Multipart request) đến máy chủ qua Axios Client, nhận về mảng link lưu trữ để nạp vào cơ sở dữ liệu.

### 💳 4. Nghiệp Vụ Thanh Toán Qua Cầu Nối WebView (WebView Payment Bridge)
- **Cơ chế hoạt động:**
  - Do VNPay và PayOS không có SDK native hoàn toàn cho React Native, Mobile App sử dụng giải pháp **WebView Bridge**.
  - Khi chủ trọ thanh toán ở màn hình [checkout.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend_Mobile_App_Expo/app/checkout.tsx), app nhận URL thanh toán từ Backend và hiển thị một component `<WebView source={{ uri: paymentUrl }} />` phủ kín màn hình.
  - Gắn sự kiện `onNavigationStateChange` vào WebView. Mỗi khi trang web chuyển hướng, ứng dụng kiểm tra địa chỉ URL hiện tại.
  - Khi phát hiện địa chỉ URL khớp với callback của backend (`/api/payments/callback`), ứng dụng sẽ chặn hành vi tải trang tiếp theo của WebView, phân tích các tham số kết quả giao dịch truyền trên URL (ví dụ: `vnp_ResponseCode=00` là thành công), lập tức tắt WebView và điều hướng người dùng về màn hình native thông báo kết quả [payment-success.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend_Mobile_App_Expo/app/payment-success.tsx) hoặc [payment-failure.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend_Mobile_App_Expo/app/payment-failure.tsx).

---

## 📂 Sơ Đồ Cấu Trúc Thư Mục (Directory Tree)

```text
MapHome_Frontend_Mobile_App_Expo/
├── app/                    # Thư mục định tuyến chính (Expo Router)
│   ├── (auth)/             # Nhóm màn hình Xác thực (Đăng nhập, Đăng ký, Quên mật khẩu)
│   ├── (tabs)/             # Nhóm màn hình Tab Bar chính dưới cùng (Home, Map, Profile)
│   │   ├── index.tsx       # Màn hình Home chính
│   │   ├── map.tsx         # Màn hình Bản đồ tìm kiếm phòng trọ
│   │   └── profile.tsx     # Màn hình Hồ sơ người dùng
│   ├── blog/               # Các trang tin tức cẩm nang
│   ├── role/               # Các trang lựa chọn vai trò (chủ trọ/khách thuê)
│   ├── room/               # Thư mục chứa màn hình chi tiết động:
│   │   └── [id].tsx        # Chi tiết phòng trọ (Nhận params id qua useLocalSearchParams)
│   ├── _layout.tsx         # Root layout cấu hình Navigation, Font và Auth Context wrapper
│   ├── checkout.tsx        # Trang thanh toán gói dịch vụ / phí kiểm định
│   ├── post-room.tsx       # Giao diện đăng bài và ghim tọa độ
│   └── user-dashboard.tsx  # Quản lý đặt lịch, phòng yêu thích của người thuê
├── components/             # Các thành phần giao diện nhỏ dùng chung
│   ├── ui/                 # Icon, Collapsible components bổ trợ
│   ├── BookingModal.tsx    # Modal đặt lịch hẹn xem phòng dạng BottomSheet
│   └── RoomMapPreview.tsx  # Bản đồ nhỏ hiển thị vị trí tĩnh của phòng trọ
├── contexts/               # Quản lý trạng thái toàn cục di động (Auth, Properties, Compare)
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
# Cấu hình chuyển đổi chạy Local/Deploy (Mới)
# - Set thành true để sử dụng Backend Local (tự động điều chỉnh theo thiết bị/giả lập)
# - Set thành false hoặc comment để kết nối tới server deploy (Railway)
EXPO_PUBLIC_USE_LOCAL_BACKEND=true

# Địa chỉ API khi kết nối tới deploy server
EXPO_PUBLIC_API_URL=https://exe101project-maphome-api.up.railway.app

# Địa chỉ IP máy tính cá nhân khi kiểm thử trên điện thoại thật (Mạng LAN)
# Ví dụ: EXPO_PUBLIC_LOCAL_API_URL=http://192.168.1.15:5000
EXPO_PUBLIC_LOCAL_API_URL=

# Cấu hình Google Auth & Maps
EXPO_PUBLIC_GOOGLE_CLIENT_ID=817734182215-ijh0r2a1fbcsm5u5nams9e92obh5cmck.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=817734182215-0bmgjcggm7k7h0qice3lff1dr7s3q638.apps.googleusercontent.com
EXPO_PUBLIC_GOONG_MAPTILES_KEY=zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF
```

### 3. Cơ chế tự động định tuyến API khi chạy Local (`EXPO_PUBLIC_USE_LOCAL_BACKEND=true`)
Mã nguồn Mobile App được thiết lập tại [utils/api.ts](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend_Mobile_App_Expo/utils/api.ts) để tự động nhận dạng môi trường chạy giả lập:
- **Giả lập Android (Android Emulator):** Tự động ánh xạ `localhost` của máy tính thành địa chỉ IP đặc biệt `http://10.0.2.2:5000`.
- **Giả lập iOS (iOS Simulator):** Kết nối trực tiếp tới `http://localhost:5000`.
- **Thiết bị thật (Expo Go):** Hãy thiết lập biến `EXPO_PUBLIC_LOCAL_API_URL` trỏ tới địa chỉ IP mạng LAN của máy tính chạy backend (ví dụ: `http://192.168.1.15:5000`) để điện thoại có thể giao tiếp với máy tính của bạn.

### 4. Chạy dự án
```bash
# Khởi động Expo Server
npm start

# Hoặc chạy và làm sạch cache (khuyên dùng khi cập nhật thư viện hoặc biến môi trường)
npx expo start -c
```
*Sau khi chạy, quét mã QR hiển thị bằng ứng dụng **Expo Go** trên điện thoại Android hoặc ứng dụng Camera mặc định trên iOS để trải nghiệm.*
