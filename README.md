# 🏠 MapHome — Hệ thống Tìm kiếm, Đăng tin & Xác thực Phòng trọ Thông minh

> Nền tảng công nghệ giúp kết nối người thuê trọ và chủ nhà trọ một cách an toàn, minh bạch và tin cậy thông qua bản đồ số và công nghệ định vị GPS thực địa.

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

MapHome phục vụ 3 nhóm đối tượng chính với quy trình đơn giản, khép kín:

#### 1. Đối với Người đi thuê trọ (Khách hàng)
1. **Tìm kiếm:** Mở Bản đồ lên, chọn tìm phòng xung quanh trường đại học hoặc nơi làm việc của mình trong bán kính từ 1km đến 5km.
2. **Lựa chọn & So sánh:** Xem chi tiết phòng (tiện ích, ảnh thực tế, khoảng cách địa điểm xung quanh). Bạn có thể bấm chọn tối đa 3 phòng để so sánh song song xem phòng nào tốt hơn.
3. **Đặt lịch hẹn:** Chọn ngày giờ rảnh, viết lời nhắn gửi cho chủ nhà để đặt lịch đến xem phòng.
4. **Hỏi Trợ lý AI:** Nếu cần tư vấn luật thuê nhà hoặc hỏi đáp nhanh, bạn chỉ cần trò chuyện với Chatbot AI tích hợp sẵn trên màn hình.

#### 2. Đối với Chủ nhà trọ (Landlord)
1. **Đăng tin nhanh chóng:** Nhập giá phòng, diện tích, các tiện nghi (Wifi, điều hòa, tủ lạnh, máy giặt...) và ghim chính xác vị trí nhà mình trên bản đồ.
2. **Yêu cầu xác thực phòng:** Để phòng của mình hiển thị ở vị trí ưu tiên và có **tích xanh xác minh (Green Badge)**, chủ nhà gửi yêu cầu hẹn lịch với đội ngũ kiểm định của MapHome.
3. **Quản lý lịch hẹn:** Mở Dashboard của chủ nhà để xem lịch hẹn gặp khách thuê đến xem phòng, tránh việc trùng lặp thời gian.

#### 3. Đối với Đội ngũ kiểm định & Quản trị hệ thống (Admin)
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
- **Backend:** Node.js, Express, MongoDB Atlas & Mongoose, Swagger API Docs, SMTP Gmail (Nodemailer), Groq AI SDK.
- **Web Frontend:** React 18, Vite, TypeScript, TailwindCSS v4, Goong Maps JS SDK.
- **Mobile App:** React Native, Expo SDK 54, NativeWind (Tailwind v3), React Native Maps, Expo Image Picker.

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
   VITE_API_BASE=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=817734182215-ijh0r2a1fbcsm5u5nams9e92obh5cmck.apps.googleusercontent.com
   VITE_GOONG_MAPTILES_KEY=zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF
   ```
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
   # Lưu ý: Thay "your-local-ip" thành địa chỉ IP mạng Wifi của máy tính bạn (Ví dụ: 192.168.1.15)
   # Không được dùng "localhost" để thiết bị thật có thể kết nối được backend.
   EXPO_PUBLIC_API_URL=http://your-local-ip:5000
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
- 💻 **Backend Developer Guide:** Xem [MapHome_backend_NodeJS/README.md](file:///e:/EXE101_Projects/EXE101_Project/MapHome_backend_NodeJS/README.md) để tìm hiểu cấu trúc Schemas, logic tính toán Haversine và phân quyền endpoint.
- 🌐 **Web Frontend Developer Guide:** Xem [MapHome_Frontend/README.md](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend/README.md) để biết cơ chế chia sẻ State của Context API và tích hợp Goong Maps.
- 📱 **Mobile App Developer Guide:** Xem [MapHome_Frontend_Mobile_App_Expo/README.md](file:///e:/EXE101_Projects/EXE101_Project/MapHome_Frontend_Mobile_App_Expo/README.md) để biết cách Expo Router hoạt động, tích hợp WebView thanh toán và lưu trữ local storage.
- 🔬 **Hướng dẫn Kiểm thử:** Xem file [TESTING_GUIDE.md](file:///e:/EXE101_Projects/EXE101_Project/TESTING_GUIDE.md) để tiến hành kiểm thử các ca sử dụng mẫu (đăng tin, tìm kiếm, kiểm duyệt GPS).
