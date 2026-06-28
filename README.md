# 🏠 MapHome — Hệ thống Tìm kiếm, Đăng tin & Xác thực Phòng trọ Thông minh

> Nền tảng công nghệ giúp kết nối người thuê trọ và chủ nhà trọ một cách an toàn, minh bạch và tin cậy thông qua bản đồ số và công nghệ định vị GPS thực địa.

---

## 🚀 TRẢI NGHIỆM NHANH BẢN DEMO TRỰC TUYẾN (Không Cần Cài Đặt)

Nếu bạn không thuộc ngành lập trình hoặc muốn xem nhanh cách hoạt động của hệ thống, hãy truy cập và trải nghiệm trực tiếp các đường link đã triển khai (deploy) dưới đây:

* **🔗 Website MapHome (Dành cho Máy tính & Điện thoại):** [https://exe201-maphome-app.vercel.app](https://exe201-maphome-app.vercel.app)
* **🔗 Cổng kết nối dữ liệu (Backend API Server):** [https://exe101project-maphome-api.up.railway.app](https://exe101project-maphome-api.up.railway.app)
* **📖 Tài liệu kỹ thuật tự động (Swagger UI):** [https://exe101project-maphome-api.up.railway.app/api-docs](https://exe101project-maphome-api.up.railway.app/api-docs)

### 💡 Hướng dẫn trải nghiệm nhanh các tính năng trong 2 phút:

* **Bước 1: Tìm phòng trên bản đồ:** Mở đường link Website. Bạn sẽ nhìn thấy ngay bản đồ tương tác hiển thị vị trí các phòng trọ thực tế. Hãy thử click vào các ghim (marker) trên bản đồ để xem nhanh ảnh phòng, giá thuê và địa chỉ.
* **Bước 2: Tìm phòng quanh trường học/công sở:** Trên bản đồ, chọn nút bộ lọc tìm quanh địa điểm (Ví dụ: Đại học Quốc Gia TP.HCM). Bản đồ sẽ vẽ một vùng tròn bán kính (1km - 5km) và lọc ra chính xác những phòng trọ nằm gần khu vực đó.
* **Bước 3: Đăng nhập/Đăng ký:** Click nút **Đăng nhập** ở góc trên cùng bên phải.
  - Bạn có thể chọn **Đăng nhập nhanh bằng tài khoản Google** của bạn.
  - Hoặc chọn **Đăng ký** tài khoản mới trong 30 giây (chọn vai trò "Khách thuê" hoặc "Chủ nhà").
* **Bước 4: Đăng tin phòng trọ mới (Dành cho Chủ nhà):**
  - Nếu bạn đăng ký tài khoản với vai trò **Chủ nhà (Landlord)**, nút **Đăng tin** sẽ xuất hiện trên menu đầu trang.
  - Nhập thông tin phòng trọ của bạn, kéo thả ghim đỏ trên bản đồ tới địa chỉ bất kỳ để lấy tọa độ, chọn tải ảnh lên và bấm đăng bài. Tin đăng mới sẽ xuất hiện trực tiếp ngay lập tức trên bản đồ chung!
* **Bước 5: Trò chuyện với Trợ lý AI (Chatbot):** Nhấn vào biểu tượng bong bóng chat màu xanh ở góc dưới bên phải màn hình. Gõ thử câu hỏi: *"Tìm phòng trọ Thủ Đức dưới 3 triệu"* hoặc *"Làm hợp đồng thuê nhà cần chú ý gì?"* để xem AI trả lời tư vấn cho bạn.

---

## 📊 TIẾN ĐỘ PHÁT TRIỂN (Development Progress)

> Cập nhật lần cuối: **23/06/2026**

### ✅ Đã hoàn thành

#### 🔑 Xác thực & Phân quyền
- [x] Đăng ký tài khoản (User / Landlord / Broker)
- [x] Đăng nhập bằng Email + Mật khẩu
- [x] Đăng nhập nhanh bằng Google OAuth 2.0
- [x] Khôi phục mật khẩu qua Email (Nodemailer SMTP Gmail)
- [x] Phân quyền theo vai trò: `user`, `landlord`, `broker`, `admin`
- [x] JWT Access Token + Refresh Token tự động gia hạn phiên

#### 🏠 Quản lý Phòng trọ
- [x] Đăng tin phòng trọ với ảnh (Cloudinary) và ghim bản đồ
- [x] Chỉnh sửa và xóa tin đăng
- [x] Tìm kiếm nâng cao (lọc giá, diện tích, tiện ích, loại phòng)
- [x] Tìm phòng theo vị trí GPS (bán kính 1-5km, toán tử `$nearSphere` MongoDB)
- [x] Xem chi tiết phòng trọ (ảnh, bản đồ, tiện ích xung quanh)
- [x] So sánh tối đa 3 phòng trọ song song
- [x] Lưu phòng yêu thích
- [x] Thống kê phòng trọ công khai (số phòng, người dùng, quận/huyện)

#### 📅 Đặt lịch hẹn xem phòng
- [x] Khách thuê đặt lịch hẹn với thông tin ngày giờ và lời nhắn
- [x] Chủ nhà nhận thông báo và duyệt / từ chối lịch hẹn
- [x] Quản lý lịch hẹn bằng Calendar (FullCalendar - Web)
- [x] Dashboard quản lý đặt lịch cho User

#### 🛡️ Xác thực thực địa & Huy hiệu tích xanh
- [x] Chủ nhà gửi yêu cầu xác minh thực địa
- [x] Admin duyệt và phân công kiểm định
- [x] Tính khoảng cách GPS bằng công thức Haversine
- [x] Tự động cấp Green Badge khi sai số GPS < 50m
- [x] Trang dịch vụ xác thực cho người dùng

#### 💳 Thanh toán & Gói dịch vụ
- [x] Thanh toán qua VNPay Sandbox
- [x] Thanh toán qua PayOS
- [x] Áp dụng mã giảm giá Voucher
- [x] Quản lý gói đăng tin (Subscription Plans)
- [x] Lịch sử giao dịch (Transactions)
- [x] Cảnh báo tin sắp hết hạn

#### 🤖 Trợ lý AI
- [x] Chatbot tư vấn phòng trọ và pháp lý (Groq LLM)
- [x] Giao diện chat nổi trên mọi trang Web

#### 📰 Blog & Nội dung
- [x] Trang Blog cẩm nang thuê trọ
- [x] Xem chi tiết bài viết
- [x] Admin quản lý bài viết

#### 🎟️ Voucher & Khuyến mãi
- [x] Admin tạo/chỉnh sửa/xóa mã giảm giá
- [x] Hiển thị voucher được quảng bá trên Trang chủ
- [x] Người dùng lưu và áp dụng voucher

#### 📊 Dashboard & Thống kê
- [x] **Admin Dashboard:** Thống kê tổng quan (người dùng, phòng, giao dịch, doanh thu)
- [x] **Landlord Dashboard:** Quản lý phòng, lịch hẹn, doanh thu, xác minh
- [x] **User Dashboard:** Lịch hẹn, phòng yêu thích, lịch sử giao dịch
- [x] **Broker Dashboard:** Quản lý leads, danh sách phòng trọ theo khu vực

#### 📱 Mobile App (React Native + Expo)
- [x] Màn hình Home (danh sách phòng nổi bật)
- [x] Bản đồ tìm kiếm phòng với GPS thời gian thực
- [x] Chi tiết phòng trọ
- [x] Đăng nhập / Đăng ký / Google OAuth
- [x] Đăng bài phòng trọ + chụp ảnh Camera
- [x] Đặt lịch hẹn xem phòng
- [x] Thanh toán qua WebView (VNPay/PayOS)
- [x] Profile & Hồ sơ cá nhân
- [x] User Dashboard (lịch hẹn, phòng lưu)
- [x] Landlord Dashboard (quản lý phòng)
- [x] Broker Dashboard
- [x] Admin Dashboard
- [x] Trang Blog, Liên hệ, Chính sách
- [x] Onboarding cho người dùng mới
- [x] Thông báo trong app

#### 🌐 Deploy & Vận hành
- [x] Backend deploy lên **Railway** (tự động từ GitHub Actions)
- [x] Web Frontend deploy lên **Vercel** (tự động từ GitHub)
- [x] Biến môi trường phân tách rõ ràng (Local / Deploy) qua `VITE_USE_LOCAL_BACKEND` và `EXPO_PUBLIC_USE_LOCAL_BACKEND`
- [x] Swagger UI tự động tại `/api-docs`
- [x] Dữ liệu thống kê trang chủ cập nhật theo thời gian thực từ API Railway

### 🔄 Đang phát triển / Cải thiện
- [ ] Tối ưu hiệu năng bản đồ khi có nhiều marker
- [ ] Push notification thời gian thực (Firebase Cloud Messaging)
- [ ] Tính năng chat trực tiếp giữa chủ nhà và khách thuê

---

## 📝 MÔ TẢ CHI TIẾT VỀ DỰ ÁN (Detailed Project Description)

### 1. Bối cảnh & Sự cấp thiết của dự án
Trong quá trình học tập và lập nghiệp tại các thành phố lớn (như TP. Hồ Chí Minh, Hà Nội, Đà Nẵng), nhu cầu tìm kiếm nhà trọ, phòng trọ luôn là mối quan tâm hàng đầu của hàng triệu sinh viên và người lao động trẻ. Tuy nhiên, thị trường này đang đối mặt với nhiều rủi ro thiếu minh bạch:
- **Tin đăng giả mạo (Fake listings):** Hình ảnh đẹp mắt, giá thuê rẻ bất ngờ nhằm lôi kéo người thuê gọi điện hoặc lừa đảo tiền đặt cọc giữ chỗ.
- **Sai lệch địa chỉ ghim:** Chủ nhà cố tình ghim sai vị trí phòng lên trung tâm để hiển thị đẹp hơn, khiến người thuê mất nhiều công sức đi xem phòng thực tế mới phát hiện ra phòng ở ngõ hẻm xa xôi.
- **Hình ảnh cũ hoặc chắp vá:** Ảnh chụp từ nhiều năm trước hoặc lấy từ dự án khác, không phản ánh chính xác tình trạng thực tế của căn phòng.

**MapHome** ra đời như một hệ sinh thái tin cậy, ứng dụng sức mạnh công nghệ số để xây dựng một môi trường kết nối trực tiếp, làm sạch dữ liệu phòng trọ ảo và đem lại sự an tâm tuyệt đối cho cộng đồng.

### 2. Ý tưởng giải pháp đột phá từ MapHome
Trái tim của dự án MapHome là **Quy trình Xác thực Định vị Hiện trường tự động**:
- **Bảo chứng bằng GPS:** Thay vì phê duyệt tin đăng một cách thủ công dễ xảy ra sai lệch, MapHome cử các kiểm định viên đến đo đạc trực tiếp tại phòng trọ. Khi chụp ảnh thực tế và bấm xác nhận, hệ thống backend sẽ tính khoảng cách bằng công thức toán học giữa vị trí thực tế của điện thoại nhân viên và vị trí chủ trọ ghim trên bản đồ số.
- **Huy hiệu tích xanh (Green Badge):** Nếu sai số khoảng cách dưới 50 mét và hình ảnh khớp thực tế, tin đăng lập tức được cấp Huy hiệu Xác minh nổi bật. Những tin đăng có tích xanh này sẽ được ưu tiên hiển thị hàng đầu trên thanh công cụ tìm kiếm và bản đồ để khách hàng ưu tiên lựa chọn.
- **Trợ lý AI đồng hành:** Một chatbot thông minh tích hợp mô hình ngôn ngữ lớn giúp giải quyết các rắc rối thường gặp như: soạn thảo điều khoản hợp đồng thuê nhà chuẩn pháp lý, tư vấn giải quyết tranh chấp đặt cọc, hay tự động đề xuất danh sách phòng phù hợp dựa trên các yêu cầu mô tả bằng ngôn ngữ tự nhiên của khách thuê.

### 3. Lợi ích mang lại cho các bên liên quan
- **Đối với người đi thuê trọ (Tenant):** Tiết kiệm 80% thời gian đi xem phòng thực địa nhờ thông tin và vị trí chính xác 100%, tránh bẫy lừa đảo đặt cọc, dễ dàng so sánh giá cả và tiện ích.
- **Đối với chủ nhà trọ (Landlord):** Tiếp cận lượng khách hàng mục tiêu lớn, chuyên nghiệp hóa quy trình quản lý đặt lịch hẹn xem phòng qua ứng dụng di động, nâng cao uy tín thương hiệu cá nhân nhờ chứng nhận tích xanh.
- **Đối với xã hội:** Góp phần số hóa thông tin bất động sản cho thuê, mang lại sự văn minh, công bằng cho thị trường bất động sản tiêu dùng.

---

## 📌 PHẦN 1: GIỚI THIỆU DÀNH CHO NGƯỜI DÙNG PHỔ THÔNG (Non-Developer Guide)
*(Nếu bạn là lập trình viên muốn cài đặt code, vui lòng cuộn xuống **Phần 2: Hướng dẫn kỹ thuật**)*

### ❓ Vấn đề thực tế & Giải pháp của MapHome

Trong thị trường thuê phòng trọ hiện nay, người đi thuê thường gặp rất nhiều khó khăn như: **tin đăng ảo**, **địa chỉ sai lệch**, **hình ảnh không đúng thực tế**, hoặc **lừa đảo tiền đặt cọc**.

**MapHome** ra đời để giải quyết triệt để các vấn đề này bằng bộ giải pháp công nghệ thông minh:

| Vấn đề của thị trường | Giải pháp đột phá từ MapHome |
| :--- | :--- |
| ❌ **Tin đăng ảo, địa chỉ giả:** Nhiều tin đăng ghi sai vị trí để thu hút người xem. | 📍 **Bản đồ số định vị chính xác:** Tích hợp bản đồ trực quan giúp ghim vị trí chính xác của phòng trọ trên thực tế. |
| ❌ **Hình ảnh lừa đảo, phòng xuống cấp:** Ảnh trên mạng lung linh nhưng thực tế rất tệ. | 🛡️ **Huy hiệu Xác minh Xanh lục (Green Badge):** Có nhân viên đến đo đạc thực tế, chụp ảnh hiện trường và chỉ cấp huy hiệu khi GPS trùng khớp dưới 50m. |
| ❌ **Mất thời gian liên hệ, xếp lịch:** Gọi điện thoại hẹn giờ xem phòng chồng chéo, không chuyên nghiệp. | 📅 **Đặt lịch hẹn & Lịch biểu:** Người thuê tự chọn ngày giờ xem phòng trực tiếp trên app. Chủ nhà quản lý danh sách cuộc hẹn qua lịch trực quan. |
| ❌ **Thiếu thông tin xung quanh:** Không biết phòng trọ có gần trường học, bệnh viện hay không. | 🏫 **Gợi ý địa điểm lân cận:** Tự động tính khoảng cách từ phòng trọ đến các trường đại học, bệnh viện, công viên xung quanh. |
| ❌ **Mơ hồ về pháp lý & thủ tục:** Khách thuê không biết cách làm hợp đồng hoặc cần tư vấn. | 🤖 **Trợ lý Trí tuệ nhân tạo (AI Assistant):** Chatbot thông minh hỗ trợ giải đáp thắc mắc, tư vấn pháp lý và gợi ý phòng trọ 24/7. |

---

### 👥 Trải nghiệm người dùng trên MapHome hoạt động như thế nào?

MapHome phục vụ 4 nhóm đối tượng chính với quy trình đơn giản, khép kín:

#### 1. Đối với Người đi thuê trọ (Khách hàng)
1. **Tìm kiếm:** Mở Bản đồ lên, chọn tìm phòng xung quanh trường đại học hoặc nơi làm việc của mình trong bán kính từ 1km đến 5km.
2. **Lựa chọn & So sánh:** Xem chi tiết phòng (tiện ích, ảnh thực tế, khoảng cách địa điểm xung quanh). Bạn có thể bấm chọn tối đa 3 phòng để so sánh song song xem phòng nào tốt hơn.
3. **Đặt lịch hẹn:** Chọn ngày giờ rảnh, viết lời nhắn gửi cho chủ nhà để đặt lịch đến xem phòng.
4. **Hỏi Trợ lý AI:** Nếu cần tư vấn luật thuê nhà hoặc hỏi đáp nhanh, bạn chỉ cần trò chuyện với Chatbot AI tích hợp sẵn trên màn hình.

#### 2. Đối với Chủ nhà trọ (Landlord)
1. **Đăng tin nhanh chóng:** Nhập giá phòng, diện tích, các tiện nghi (Wifi, điều hòa, tủ lạnh, máy giặt...) và ghim chính xác vị trí nhà mình trên bản đồ.
2. **Yêu cầu xác thực phòng:** Để phòng của mình hiển thị ở vị trí ưu tiên và có **tích xanh xác minh (Green Badge)**, chủ nhà gửi yêu cầu hẹn lịch với đội ngũ kiểm định của MapHome.
3. **Quản lý lịch hẹn:** Mở Dashboard của chủ nhà để xem lịch hẹn gặp khách thuê đến xem phòng, tránh việc trùng lặp thời gian.

#### 3. Đối với Môi giới (Broker)
1. **Quản lý danh sách phòng:** Broker theo dõi và quản lý danh sách phòng trọ thuộc khu vực phụ trách.
2. **Theo dõi Leads:** Quản lý danh sách khách hàng tiềm năng quan tâm đến phòng trọ.

#### 4. Đối với Đội ngũ kiểm định & Quản trị hệ thống (Admin)
1. **Kiểm tra hiện trường:** Nhận yêu cầu từ chủ nhà, nhân viên kiểm định của MapHome sẽ đến tận địa chỉ phòng trọ để đo đạc và chụp ảnh thực tế.
2. **Xác thực tự động bằng GPS:** Khi nhân viên chụp ảnh và bấm xác nhận tại phòng trọ, hệ thống sẽ tự động đo khoảng cách GPS giữa điện thoại của nhân viên và tọa độ chủ nhà ghim trên bản đồ. Nếu sai số dưới 50m, phòng trọ đó lập tức được cấp **Huy hiệu tích xanh (Green Badge)** chứng thực an toàn.

---

### 📦 Các thành phần của sản phẩm MapHome

Dự án MapHome được phát triển đồng bộ trên cả điện thoại và máy tính để mang lại trải nghiệm tiện lợi nhất:
* **Trang web MapHome (Website):** Phù hợp cho việc tìm kiếm, tra cứu thông tin phòng trên màn hình máy tính lớn tại nhà.
* **Ứng dụng di động MapHome (Mobile App):** Tiện lợi khi người đi thuê đi xem phòng ngoài đường, cần định vị GPS chỉ đường đến phòng trọ, hoặc chủ nhà cần chụp ảnh phòng bằng camera điện thoại để đăng tin trực tiếp.
* **Hệ thống xử lý trung tâm (Backend API):** Bộ não trung tâm lưu trữ thông tin phòng trọ, tài khoản người dùng, xử lý thanh toán và tính toán khoảng cách GPS.

---

## 💻 PHẦN 2: HƯỚNG DẪN KỸ THUẬT CHO LẬP TRÌNH VIÊN (Developer Guide)

Hệ thống được tổ chức dưới dạng mono-repo gồm 3 thư mục tương ứng với 3 phân hệ:

```text
EXE101_Project/ (Thư mục gốc)
├── MapHome_backend_NodeJS/                  # Hệ thống API Server (Express + MongoDB)
├── MapHome_Frontend/                        # Ứng dụng Web (React + Vite + TailwindCSS v4)
└── MapHome_Frontend_Mobile_App_Expo/       # Ứng dụng Di động (React Native + Expo SDK 54)
```

### 🛠️ Công nghệ sử dụng
- **Backend:** Node.js, Express, MongoDB Atlas & Mongoose, Swagger API Docs, SMTP Gmail (Nodemailer), Groq AI SDK, Cloudinary, VNPay, PayOS.
- **Web Frontend:** React 18, Vite, TypeScript, TailwindCSS v4, Goong Maps JS SDK, Framer Motion, FullCalendar, Material UI v7.
- **Mobile App:** React Native, Expo SDK 54, NativeWind (Tailwind v3), React Native Maps, Expo Image Picker, Expo Location, Firebase Auth.

---

### 🚀 Quy trình cài đặt & khởi chạy toàn bộ mã nguồn

#### 📋 Yêu cầu chuẩn bị trước
- Đã cài đặt **Node.js** (Phiên bản đề xuất v18 hoặc v20).
- Máy tính có cài đặt phần mềm quản lý database **MongoDB Compass**.
- Điện thoại di động đã tải sẵn app **Expo Go** (có trên App Store và Google Play).

---

### Bước 1: Khởi Chạy Backend API Server
1. Mở terminal di chuyển vào thư mục backend:
   ```bash
   cd MapHome_backend_NodeJS
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Copy file `.env.example` thành file `.env` và điền cấu hình kết nối MongoDB Atlas, Cloudinary và SMTP Gmail:
   ```dotenv
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster1
   DB_NAME=MapHome
   JWT_SECRET=your_jwt_secret
   # Điền thêm cấu hình Cloudinary, Gmail Nodemailer, PayOS, VNPay, Goong Maps...
   ```
4. **Thiết lập Chỉ mục Bản đồ (Geospatial Index):**
   Mở MongoDB Compass kết nối database của bạn, chọn database `MapHome`, vào collection `properties`, chọn tab **Indexes** và tạo index:
   - **Tên trường:** `location`
   - **Loại Index:** `2dsphere`
   *(Hoặc chạy lệnh trong Mongo shell: `db.properties.createIndex({ "location": "2dsphere" })`)*
5. Khởi chạy server ở chế độ lập trình:
   ```bash
   npm run dev
   ```
   *Server sẽ hoạt động tại địa chỉ: `http://localhost:5000`. Bạn có thể truy cập `http://localhost:5000/api-docs` để xem tài liệu Swagger.*

---

### Bước 2: Khởi Chạy Web Frontend
1. Mở một cửa sổ terminal mới và di chuyển vào thư mục web:
   ```bash
   cd MapHome_Frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` từ file mẫu:
   ```dotenv
   # true = dùng localhost:5000 | false = dùng VITE_API_BASE (Railway deploy)
   VITE_USE_LOCAL_BACKEND=true
   VITE_API_BASE=https://exe101project-maphome-api.up.railway.app
   VITE_GOOGLE_CLIENT_ID=817734182215-ijh0r2a1fbcsm5u5nams9e92obh5cmck.apps.googleusercontent.com
   VITE_GOONG_MAPTILES_KEY=zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF
   ```
   > ⚠️ **Khi deploy lên Vercel:** Set tất cả biến môi trường trong Vercel Dashboard và đặt `VITE_USE_LOCAL_BACKEND=false`.
4. Chạy ứng dụng web:
   ```bash
   npm run dev
   ```
   *Ứng dụng Web sẽ mở tại địa chỉ: `http://localhost:5173`.*

---

### Bước 3: Khởi Chạy Mobile App
1. Mở terminal thứ ba và di chuyển vào thư mục mobile:
   ```bash
   cd MapHome_Frontend_Mobile_App_Expo
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env` tại thư mục gốc của mobile app:
   ```dotenv
   # true = kết nối localhost backend | false = kết nối Railway deploy
   EXPO_PUBLIC_USE_LOCAL_BACKEND=false
   EXPO_PUBLIC_API_URL=https://exe101project-maphome-api.up.railway.app
   EXPO_PUBLIC_LOCAL_API_URL=
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=817734182215-ijh0r2a1fbcsm5u5nams9e92obh5cmck.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=817734182215-0bmgjcggm7k7h0qice3lff1dr7s3q638.apps.googleusercontent.com
   EXPO_PUBLIC_GOONG_MAPTILES_KEY=zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF
   ```
4. Khởi chạy máy chủ Expo:
   ```bash
   npm start
   ```
5. Mở ứng dụng trên điện thoại:
   - Sử dụng ứng dụng **Expo Go** trên điện thoại để quét mã QR hiển thị trên màn hình terminal để tải và trải nghiệm.
   - Nhấn `a` trên terminal để khởi chạy trên trình giả lập Android Studio hoặc `i` để khởi chạy trên Xcode Simulator.

---

## 📖 Hướng Dẫn Kỹ Thuật Chuyên Sâu Từng Phần

Để tìm hiểu sâu hơn về kiến trúc mã nguồn của từng dự án thành phần, vui lòng đọc các hướng dẫn chuyên biệt dưới đây:
- 💻 **Backend Developer Guide:** Xem [MapHome_backend_NodeJS/README.md](./MapHome_backend_NodeJS/README.md) để tìm hiểu cấu trúc Schemas, logic tính toán Haversine và phân quyền endpoint.
- 🌐 **Web Frontend Developer Guide:** Xem [MapHome_Frontend/README.md](./MapHome_Frontend/README.md) để biết cơ chế chia sẻ State của Context API và tích hợp Goong Maps.
- 📱 **Mobile App Developer Guide:** Xem [MapHome_Frontend_Mobile_App_Expo/README.md](./MapHome_Frontend_Mobile_App_Expo/README.md) để biết cách Expo Router hoạt động, tích hợp WebView thanh toán và lưu trữ local storage.
