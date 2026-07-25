# 🌐 MapHome Web Frontend — Developer & Architecture Guide

Tài liệu hướng dẫn phát triển và cấu trúc mã nguồn giao diện Web dành cho lập trình viên (Developer). Dự án được xây dựng bằng **React (v18), Vite, và TailwindCSS (v4)**.

> 🔗 **Web Deploy:** [https://exe201-maphome-app.vercel.app](https://exe201-maphome-app.vercel.app)

---

## 📊 TIẾN ĐỘ WEB FRONTEND (Frontend Progress)

> Cập nhật lần cuối: **23/06/2026**

### ✅ Đã hoàn thành

#### 📄 Trang (Pages — 26 files)
| Trang | Mô tả |
|:------|:------|
| `HomePage.tsx` | Trang chủ: slider ảnh, thống kê thực, phòng nổi bật, voucher khuyến mãi, blog, testimonials, Section quảng bá Mobile App kèm khung mockup giả lập |
| `MapPage.tsx` | Bản đồ Goong Maps tương tác với marker phòng trọ, bộ lọc nâng cao |
| `RoomDetailPage.tsx` | Chi tiết phòng trọ: ảnh slideshow, bản đồ nhỏ, tiện ích xung quanh, đặt lịch hẹn |
| `PostRoomPage.tsx` | Đăng / chỉnh sửa tin phòng trọ với ghim bản đồ và upload ảnh đám mây |
| `LoginPage.tsx` | Đăng nhập email/mật khẩu + Google OAuth |
| `RegisterPage.tsx` | Đăng ký tài khoản chọn vai trò |
| `ForgotPasswordPage.tsx` | Khôi phục mật khẩu qua email |
| `LandlordDashboardV2.tsx` | Dashboard chủ nhà: phòng, lịch hẹn (FullCalendar), xác minh, voucher, cài đặt |
| `UserDashboard.tsx` | Dashboard khách thuê: lịch hẹn, phòng yêu thích, giao dịch, hồ sơ |
| `BrokerDashboard.tsx` | Dashboard môi giới: leads, phòng trọ khu vực |
| `AdminPage.tsx` | Dashboard Admin: thống kê, người dùng, phòng, xác minh, blog, voucher |
| `AdminVoucherView.tsx` | Quản lý voucher (Admin) |
| `CheckoutPage.tsx` | Thanh toán gói dịch vụ + áp dụng voucher giảm giá |
| `PaymentSuccessPage.tsx` | Thông báo thanh toán thành công |
| `PaymentFailurePage.tsx` | Thông báo thanh toán thất bại |
| `ComparePage.tsx` | So sánh tối đa 3 phòng trọ song song |
| `BlogPage.tsx` | Danh sách bài viết cẩm nang thuê trọ |
| `BlogDetailPage.tsx` | Chi tiết bài viết |
| `VerificationServicePage.tsx` | Trang giới thiệu dịch vụ xác minh thực địa |
| `PricingPage.tsx` | Bảng giá gói đăng tin |
| `ContactPage.tsx` | Form liên hệ |
| `PolicyPage.tsx` | Chính sách sử dụng |
| `SettingsView.tsx` | Cài đặt tài khoản |
| `RevenueView.tsx` | Thống kê doanh thu (Landlord) |
| `ExpiryWarningDemo.tsx` | Demo cảnh báo tin sắp hết hạn |
| `MaintenancePage.tsx` | Trang bảo trì hệ thống |

#### 🧩 Components nổi bật
- [x] `Navbar.tsx` — Thanh điều hướng responsive (Desktop + Mobile Web) tích hợp nút Tải App APK và QR Code popover
- [x] `Footer.tsx` — Footer đầy đủ thông tin tích hợp mã QR Code và nút Tải APK
- [x] `ApkDownloadBanner.tsx` — Banner thông minh dưới Mobile nhận diện in-app browser (Facebook/Zalo) và hướng dẫn cài đặt file APK
- [x] `HeroCarousel.tsx` — Slider ảnh trang chủ tự động
- [x] `PropertyCard.tsx` — Card hiển thị phòng trọ (hỗ trợ Green Badge)
- [x] `FilterPanel.tsx` — Bộ lọc tìm kiếm nâng cao
- [x] `BookingDialog.tsx` — Dialog đặt lịch hẹn xem phòng
- [x] `CalendarView.tsx` — FullCalendar hiển thị lịch hẹn của chủ nhà
- [x] `LandlordPinMap.tsx` — Bản đồ ghim vị trí khi đăng tin (kéo thả)
- [x] `SearchByWorkplace.tsx` — Tìm phòng theo địa điểm làm việc/trường học
- [x] `CompareFloatingBar.tsx` — Thanh nổi so sánh phòng (tối đa 3)
- [x] `AIChatAssistant.tsx` — Chatbot AI nổi trên mọi trang
- [x] `RoleBadge.tsx` — Badge vai trò người dùng
- [x] `ImageWithFallback.tsx` — Ảnh có fallback khi lỗi

#### 🗃️ State Management (Context API)
- [x] `AuthContext.tsx` — Quản lý phiên đăng nhập, vai trò, auto-refresh token
- [x] `PropertiesContext.tsx` — Danh sách phòng trọ toàn cục, bộ lọc
- [x] `CompareContext.tsx` — Quản lý danh sách phòng đang so sánh
- [x] `VerificationsContext.tsx` — Quản lý yêu cầu xác minh

#### 🚀 Deploy & Môi trường
- [x] Deploy tự động lên **Vercel** từ GitHub
- [x] Cấu hình biến môi trường Vercel: `VITE_API_BASE`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOONG_MAPTILES_KEY`, `VITE_USE_LOCAL_BACKEND=false`
- [x] Hỗ trợ chạy local với `VITE_USE_LOCAL_BACKEND=true`
- [x] Dữ liệu thống kê trang chủ cập nhật thực tế từ Railway API

---

## 🛠️ Technology Stack & Thư Viện Sử Dụng
- **Core:** React 18 & TypeScript
- **Bundler & Dev Server:** Vite (tối ưu hóa tốc độ build)
- **Styling:** TailwindCSS v4 (`@tailwindcss/vite` plugin) & Material UI (MUI v7) cho một số linh kiện form nâng cao.
- **Routing:** React Router v7 (quản lý lịch sử và chuyển trang)
- **Interactive Maps:** Goong Maps JS SDK (`@goongmaps/goong-js`)
- **State Management:** React Context API (quản lý Auth, Properties, Compare và Verifications)
- **Animations:** Framer Motion (tạo chuyển động mượt mà)
- **Calendar UI:** FullCalendar React SDK (xem lịch đặt lịch xem phòng của chủ nhà)

---

## 💼 Chi Tiết Các Nghiệp Vụ Cốt Lõi Trên Web Frontend

### 🔑 1. Nghiệp Vụ Xác Thực & Đăng Nhập (Auth & Google OAuth)
- **Cơ chế hoạt động:**
  - Đăng nhập thông thường: Form thu thập dữ liệu, gửi tới `/api/auth/login`. Thành công, `AuthContext` lưu giữ token và thông tin cá nhân.
  - Đăng nhập Google: Tích hợp thư viện `@react-oauth/google`. Sau khi người dùng xác thực với Google, client nhận về credential, gửi về backend để kiểm tra/đăng ký tài khoản tự động và khởi tạo phiên làm việc.
- **Phân hướng vai trò:** Hệ thống đọc trường `role` trong thông tin user để chuyển hướng tự động: `admin` -> Admin Dashboard, `landlord` -> Landlord Dashboard, `broker` -> Broker Dashboard, `user` -> User Dashboard.

### 📍 2. Nghiệp Vụ Đăng Tin & Ghim Vị Trí Bản Đồ (Post Room & Pin Coordinate)
- **Cơ chế hoạt động:**
  - Tại trang [PostRoomPage.tsx](./src/app/pages/PostRoomPage.tsx), form nhập liệu thu thập các thông tin phòng trọ.
  - Tích hợp component [LandlordPinMap.tsx](./src/app/components/LandlordPinMap.tsx). Bản đồ Goong Maps hiển thị một marker có thể kéo thả. Khi ghim dừng ở đâu, hàm lắng nghe sự kiện `dragend` lấy tọa độ `[lng, lat]` gán ngược lại vào form.
  - Hỗ trợ tải nhiều ảnh: Chủ trọ chọn ảnh phòng, hệ thống gửi ảnh đến `/api/uploads/multiple` để nhận về mảng URLs ảnh lưu trữ đám mây.

### 🔍 3. Nghiệp Vụ Tìm Phòng & Lọc Không Gian (Search & Location Filters)
- **Cơ chế hoạt động:**
  - Trang [MapPage.tsx](./src/app/pages/MapPage.tsx) kết nối với [PropertiesContext.tsx](./src/app/contexts/PropertiesContext.tsx). Khi người dùng kéo bản đồ hoặc thay đổi bộ lọc trên [FilterPanel.tsx](./src/app/components/FilterPanel.tsx) (giá cả, diện tích, tiện ích), Context sẽ kích hoạt gửi yêu cầu tìm kiếm lên `/api/properties/search` và cập nhật lại danh sách Marker hiển thị.
  - **Tìm kiếm theo Địa điểm làm việc / Trường đại học:** Component [SearchByWorkplace.tsx](./src/app/components/SearchByWorkplace.tsx) định nghĩa sẵn tọa độ của các trường học trọng điểm. Khi người dùng chọn địa điểm, bản đồ tự động dịch chuyển và vẽ một vòng tròn bán kính (1km - 5km), đồng thời gửi API tìm kiếm các phòng trọ nằm trong bán kính đó.

### 📅 4. Nghiệp Vụ Đặt Lịch Xem Phòng (Room Viewing Booking)
- **Cơ chế hoạt động:**
  - Tại trang [RoomDetailPage.tsx](./src/app/pages/RoomDetailPage.tsx), khách thuê bấm nút đặt lịch hẹn. Hệ thống mở [BookingDialog.tsx](./src/app/components/BookingDialog.tsx).
  - Khách chọn ngày giờ bằng lịch tích hợp và nhập lời nhắn. Sau khi bấm xác nhận, hệ thống gọi API `/api/bookings` kèm token chứng thực của khách.
  - Phía chủ trọ sẽ nhận được thông báo ngay lập tức. Trên Dashboard, component [CalendarView.tsx](./src/app/components/CalendarView.tsx) sử dụng FullCalendar tự động hiển thị cuộc hẹn mới.

### 💳 5. Nghiệp Vụ Áp Mã Giảm Giá & Thanh Toán (Voucher & Checkout Flow)
- **Cơ chế hoạt động:**
  - Trang [CheckoutPage.tsx](./src/app/pages/CheckoutPage.tsx) hiển thị thông tin hóa đơn. Người dùng nhập mã giảm giá, bấm áp dụng. Hệ thống gửi yêu cầu lên API để xác nhận giảm giá thành công và cập nhật lại số tiền hiển thị.
  - Người dùng được chuyển hướng đến trang VNPay/PayOS. Sau khi thanh toán thành công, ngân hàng sẽ redirect trở lại trang kết quả của Web.

### 🤖 6. Trợ lý AI (Multi-Model AI Chatbot)
- **Cơ chế hoạt động:**
  - Trang web tích hợp [AIChatAssistant.tsx](./src/app/components/AIChatAssistant.tsx) là một giao diện chat nổi.
  - Người dùng có thể chọn Model AI (Google Gemini, Groq Llama 3.3, OpenRouter, Monica AI, GitHub Models, SambaNova) thông qua menu xổ xuống mượt mà.
  - Khi gửi câu hỏi, Frontend truyền kèm API Key bảo mật (`VITE_MAPHOME_AI_API_KEY`) qua header `x-api-key` xuống Server Python.
  - AI phản hồi bằng Server-Sent Events (SSE) để hiển thị chữ chạy thời gian thực (typing effect). Nếu người dùng yêu cầu tra cứu phòng trọ, AI sẽ tự động gọi hàm xuống CSDL và trả về kết quả ngay trong ô chat.

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
# true = localhost:5000 | false = Railway deploy (VITE_API_BASE)
VITE_USE_LOCAL_BACKEND=true

VITE_API_BASE=https://exe101project-maphome-api.up.railway.app
VITE_GOOGLE_CLIENT_ID=817734182215-ijh0r2a1fbcsm5u5nams9e92obh5cmck.apps.googleusercontent.com
VITE_GOONG_MAPTILES_KEY=zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF
```

> ⚠️ **Khi deploy lên Vercel:** Thêm biến môi trường trong Vercel Dashboard → Settings → Environment Variables và đặt `VITE_USE_LOCAL_BACKEND=false`. File `.env` nằm trong `.gitignore` và **không được push lên Git**.

### 3. Chạy Server ở máy cục bộ
```bash
npm run dev
```
*Trang web sẽ tự chạy trên địa chỉ: `http://localhost:5173`*

> [!NOTE]
> Để thử nghiệm trên các thiết bị di động trong cùng mạng LAN, file `vite.config.ts` đã được cấu hình `server: { host: true }`. Khi chạy `npm run dev`, Vite sẽ hiển thị cả địa chỉ IP mạng nội bộ của bạn (ví dụ: `http://192.168.1.15:5173`), cho phép truy cập trực tiếp từ điện thoại.

### 4. Cơ chế tự động giải quyết URL API
Toàn bộ mã nguồn Frontend gọi API được cấu hình tập trung qua [api.ts](./src/app/utils/api.ts):
- Nếu `VITE_USE_LOCAL_BACKEND=true`, URL kết nối sẽ tự động trỏ về `http://localhost:5000`.
- Nếu `VITE_USE_LOCAL_BACKEND=false`, URL kết nối sẽ trỏ về `VITE_API_BASE` (Railway).

### 5. Build sản phẩm sẵn sàng Deploy
```bash
npm run build
```
*Mã nguồn tối ưu hóa được xuất ra thư mục `dist/`.*