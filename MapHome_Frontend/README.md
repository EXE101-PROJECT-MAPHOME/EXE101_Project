# 🌐 MapHome Web Frontend — Developer & Architecture Guide

Tài liệu hướng dẫn phát triển và cấu trúc mã nguồn giao diện Web dành cho lập trình viên (Developer). Dự án được xây dựng bằng **React (v18), Vite, và TailwindCSS (v4)**.

---

## 🛠️ Technology Stack & Thư Viện Sử Dụng
- **Core:** React 18 & TypeScript
- **Bundler & Dev Server:** Vite (tối ưu hóa tốc độ build)
- **Styling:** TailwindCSS v4 (`@tailwindcss/vite` plugin) & Material UI (MUI v7) cho một số linh kiện form nâng cao.
- **Routing:** React Router v7 (quản lý lịch sử và chuyển trang)
- **Interactive Maps:** Goong Maps JS SDK (`@goongmaps/goong-js`)
- **State Management:** React Context API (quản lý Auth, Properties, Compare và Verifications)
- **Animations:** Framer Motion (Framer `motion`) tạo chuyển động mượt mà
- **Calendar UI:** FullCalendar React SDK (xem lịch đặt lịch xem phòng của chủ nhà)

---

## 💼 Chi Tiết Các Nghiệp Vụ Cốt Lõi Trên Web Frontend

Dưới đây là cách mã nguồn Frontend hiện thực hóa các luồng nghiệp vụ hệ thống:

### 🔑 1. Nghiệp Vụ Xác Thực & Đăng Nhập (Auth & Google OAuth)
- **Cơ chế hoạt động:** 
  - Đăng nhập thông thường: Form thu thập dữ liệu, gửi tới `/api/auth/login`. Thành công, `AuthContext` lưu giữ token và thông tin cá nhân.
  - Đăng nhập Google: Tích hợp thư viện `@react-oauth/google`. Sau khi người dùng xác thực với Google, client nhận về credential, gửi về backend để kiểm tra/đăng ký tài khoản tự động và khởi tạo phiên làm việc.
- **Phân hướng vai trò:** Hệ thống đọc trường `role` trong thông tin user để chuyển hướng tự động: `admin` -> Admin Dashboard, `landlord` -> Landlord Dashboard, `user` -> User Dashboard.

### 📍 2. Nghiệp Vụ Đăng Tin & Ghim Vị Trí Bản Đồ (Post Room & Pin Coordinate)
- **Cơ chế hoạt động:** 
  - Tại trang [PostRoomPage.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/pages/PostRoomPage.tsx), form nhập liệu thu thập các thông tin phòng trọ.
  - Tích hợp component [LandlordPinMap.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/components/LandlordPinMap.tsx). Bản đồ Goong Maps hiển thị một marker có thể kéo thả. Khi ghim dừng ở đâu, hàm lắng nghe sự kiện `dragend` lấy tọa độ `[lng, lat]` gán ngược lại vào form.
  - Hỗ trợ tải nhiều ảnh: Chủ trọ chọn ảnh phòng, hệ thống gửi ảnh đến `/api/uploads/multiple` để nhận về mảng URLs ảnh lưu trữ đám mây. Mảng ảnh này được nạp vào trường `images` của form và submit lên API tạo phòng `/api/properties`.

### 🔍 3. Nghiệp Vụ Tìm Phòng & Lọc Không Gian (Search & Location Filters)
- **Cơ chế hoạt động:**
  - Trang [MapPage.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/pages/MapPage.tsx) kết nối với [PropertiesContext.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/contexts/PropertiesContext.tsx). Khi người dùng kéo bản đồ hoặc thay đổi bộ lọc trên [FilterPanel.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/components/FilterPanel.tsx) (giá cả, diện tích, tiện ích), Context sẽ kích hoạt gửi yêu cầu tìm kiếm lên `/api/properties/search` và cập nhật lại danh sách Marker hiển thị.
  - **Tìm kiếm theo Địa điểm làm việc / Trường đại học:** Component [SearchByWorkplace.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/components/SearchByWorkplace.tsx) định nghĩa sẵn tọa độ của các trường học trọng điểm. Khi người dùng chọn địa điểm, bản đồ tự động dịch chuyển và vẽ một vòng tròn bán kính (1km - 5km) đại diện cho vùng tìm kiếm, đồng thời gửi API tìm kiếm các phòng trọ nằm trong bán kính đó.

### 📅 4. Nghiệp Vụ Đặt Lịch Xem Phòng (Room Viewing Booking)
- **Cơ chế hoạt động:**
  - Tại trang [RoomDetailPage.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/pages/RoomDetailPage.tsx), khách thuê bấm nút đặt lịch hẹn. Hệ thống mở [BookingDialog.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/components/BookingDialog.tsx).
  - Khách chọn ngày giờ bằng lịch tích hợp và nhập lời nhắn. Sau khi bấm xác nhận, hệ thống gọi API `/api/bookings` kèm token chứng thực của khách.
  - Phía chủ trọ sẽ nhận được thông báo ngay lập tức. Trên Dashboard, component [CalendarView.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/components/CalendarView.tsx) sử dụng FullCalendar tự động hiển thị cuộc hẹn mới dưới dạng một sự kiện thời gian (Event) giúp chủ trọ quản lý công việc tốt hơn.

### 💳 5. Nghiệp Vụ Áp Mã Giảm Giá & Thanh Toán (Voucher & Checkout Flow)
- **Cơ chế hoạt động:**
  - Trang [CheckoutPage.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/pages/CheckoutPage.tsx) hiển thị thông tin hóa đơn. Người dùng nhập mã giảm giá, bấm áp dụng. Hệ thống gửi yêu cầu lên API để xác nhận giảm giá thành công và cập nhật lại số tiền hiển thị.
  - Khi bấm Thanh toán, Frontend gửi yêu cầu tạo giao dịch thanh toán lên Backend và nhận về URL dẫn đến trang thanh toán của VNPay/PayOS.
  - Người dùng được chuyển hướng trực tiếp đến trang VNPay/PayOS. Sau khi quét mã QR hoặc nhập tài khoản ngân hàng thanh toán thành công, ngân hàng sẽ redirect trở lại trang kết quả của Web ([PaymentSuccessPage.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/pages/PaymentSuccessPage.tsx) hoặc [PaymentFailurePage.tsx](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/src/app/pages/PaymentFailurePage.tsx)) để thông báo trạng thái giao dịch cho người dùng.

---

## 📂 Sơ Đồ Cấu Trúc Thư Mục (Directory Tree)

```text
MapHome_Frontend/
├── src/
│   ├── app/
│   │   ├── components/     # Các linh kiện UI nhỏ tái sử dụng (Card, Calendar, Dialogs)
│   │   ├── constants/      # Khai báo hằng số (tiện ích, danh mục, cấu hình cố định)
│   │   ├── contexts/       # Quản lý trạng thái toàn cục của App (React Contexts)
│   │   ├── data/           # Mock data để kiểm thử giao diện
│   │   ├── hooks/          # React hooks tùy biến (custom hooks)
│   │   ├── pages/          # Thành phần trang hoàn chỉnh (Home, Map, Dashboards)
│   │   ├── utils/          # Các hàm tiện ích bổ trợ (Định dạng tiền tệ, ngày tháng)
│   │   └── App.tsx         # Định tuyến Router chính và khai báo phân cấp trang
│   ├── lib/                # Khởi tạo client kết nối (Firebase Auth, Axios, Socket.IO)
│   ├── styles/             # Khai báo CSS toàn cục và tích hợp Tailwind
│   └── main.tsx            # Entrypoint kết xuất ứng dụng React vào DOM
├── package.json            # Quản lý thư viện cài đặt và các scripts build
└── vite.config.ts          # Cấu hình Vite bundler & plugin TailwindCSS v4
```

---

## 🚀 Hướng Dẫn Phát Triển (Local Development Setup)

### 1. Cài đặt các gói thư viện
```bash
npm install
```

### 2. Thiết lập biến môi trường
Tạo file `.env` ở thư mục gốc của frontend:
```dotenv
VITE_API_BASE=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=817734182215-ijh0r2a1fbcsm5u5nams9e92obh5cmck.apps.googleusercontent.com
VITE_GOONG_MAPTILES_KEY=zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF
```

### 3. Chạy Server ở máy cục bộ
```bash
npm run dev
```
*Trang web sẽ tự chạy trên địa chỉ: `http://localhost:5173`*

### 4. Build sản phẩm sẵn sàng Deploy
```bash
npm run build
```
*Mã nguồn tối ưu hóa được xuất ra thư mục `dist/`.*