# MapHome AI Service (Python FastAPI)

Dự án này là API cho trợ lý ảo AI của MapHome, được viết bằng Python (FastAPI). 
Phiên bản mới nhất đã được nâng cấp mạnh mẽ với kiến trúc Đa Mô Hình (Multi-Model AI) và bảo mật chuyên sâu.

## 🌟 Các tính năng nổi bật:
- Hỗ trợ đa nền tảng AI: **Google Gemini (Native REST API)**, **Groq Llama 3.3**, **OpenRouter**, **Monica AI**, **GitHub Models**, **SambaNova Cloud**.
- **Auto-Routing & Fallback**: Tự động chuyển đổi sang AI dự phòng nếu model chính gặp lỗi 404/429 (hết quota, bị giới hạn, v.v.).
- **Function Calling**: AI tự động gọi xuống Database (`search_properties`) để tra cứu phòng trọ theo yêu cầu thực tế của khách hàng.
- **Bảo mật API Key độc lập**: Bảo vệ toàn bộ endpoint `/chat` bằng hệ thống `x-api-key`.
- **Streaming Response**: Sử dụng Server-Sent Events (SSE) để truyền từng chữ của AI lên frontend theo thời gian thực (giống ChatGPT).

## 🚀 Hướng dẫn Deploy

Vì tính chất của AI Streaming cần thời gian chạy dài (long-polling), **KHUYẾN NGHỊ DEPLOY LÊN RENDER.COM HOẶC RAILWAY.APP**. (Deploy lên Vercel Serverless Function dễ bị ngắt kết nối giữa chừng do Timeout).

### Thêm Biến môi trường (Environment Variables):
Khi deploy lên Render/Railway, bạn cần khai báo các biến sau:
- `MAPHOME_AI_API_KEY`: Mật khẩu bạn tự đặt để bảo vệ cổng API (Frontend phải truyền cái này qua header `x-api-key`).
- `MONGO_URI`: Link kết nối cơ sở dữ liệu MongoDB.
- `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`: Các API Key của Google Gemini.
- `OPENROUTER_API_KEY`: API Key của OpenRouter (nếu dùng).
- `GROQ_API_KEY`: API Key của Groq (nếu dùng).
- `MONICA_API_KEY`: API Key của Monica AI (GPT-4o).
- `GITHUB_API_KEY`: Personal Access Token của GitHub để dùng GitHub Models (cần cấp quyền Models: Read-only).
- `SAMBANOVA_API_KEY`: API Key của SambaNova Cloud để chạy Llama 3.3 siêu tốc.
