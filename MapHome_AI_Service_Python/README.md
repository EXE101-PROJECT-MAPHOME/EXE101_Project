# MapHome AI Service (Python FastAPI)

Dự án này là API cho trợ lý ảo AI của MapHome, được viết bằng Python (FastAPI).

## 🚀 Hướng dẫn Deploy lên Vercel (Miễn phí)

Vì Koyeb hiện tại đã bị giới hạn, hệ thống này đã được cấu hình sẵn để deploy trực tiếp lên **Vercel** bằng môi trường Serverless.

### Các bước thực hiện:

1. **Chuẩn bị mã nguồn:**
   - Đảm bảo bạn đã đẩy toàn bộ mã nguồn (bao gồm file `vercel.json` và thư mục này) lên Github (nhánh `main`).

2. **Thêm dự án trên Vercel:**
   - Đăng nhập vào trang chủ [Vercel](https://vercel.com).
   - Chọn **Add New -> Project**.
   - Cấp quyền truy cập Github và chọn kho lưu trữ (Repository) `EXE101_Project` của bạn.

3. **Cấu hình thư mục gốc (Root Directory):**
   - Vercel mặc định sẽ deploy thư mục ngoài cùng. Vì vậy, ở bước cấu hình dự án, bạn **BẮT BUỘC** phải chỉnh lại `Root Directory`.
   - Bấm nút **Edit** ở phần Root Directory và chọn thư mục: `MapHome_AI_Service_Python`.

4. **Thêm Biến môi trường (Environment Variables):**
   - Mở rộng phần `Environment Variables`.
   - Copy các giá trị từ file `.env` local của bạn lên đây:
     - `GROQ_API_KEY`: <Nhập key của Groq>
     - `MONGO_URI`: <Nhập link kết nối MongoDB của bạn>

5. **Deploy:**
   - Bấm nút **Deploy** và chờ khoảng 1-2 phút.
   - Vercel sẽ tự động cài đặt `requirements.txt` và biên dịch API dựa trên file `vercel.json`.

---
*Lưu ý: Bạn có thể xóa file `Procfile` đi vì file đó chỉ dùng cho Koyeb hoặc Render. Đối với Vercel, file `vercel.json` là tất cả những gì chúng ta cần.*
