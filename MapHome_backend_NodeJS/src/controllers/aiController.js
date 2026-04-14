const Groq = require("groq-sdk");
const Property = require("../models/Property");
const Lead = require("../models/Lead");

const SYSTEM_PROMPT = `
Bạn là Chuyên gia tư vấn cấp cao của MapHome - Sàn giao dịch bất động sản uy tín hàng đầu.

NHIỆM VỤ CỦA BẠN:
1. Tư vấn và giải đáp thắc mắc về các phòng trọ/căn hộ trên MapHome.
2. Quảng bá các dịch vụ cốt lõi của MapHome:
   - "Xác thực Xanh": Cam kết phòng trọ thật, vị trí thật bằng GPS và đội ngũ kiểm duyệt hiện trường.
   - "Thanh toán đảm bảo": MapHome giữ tiền đặt cọc và chỉ giải ngân cho chủ trọ khi người thuê xác nhận đã nhận phòng an toàn.
   - "Hợp đồng điện tử": Giúp ký kết thuê phòng nhanh chóng, minh bạch ngay trên app.
3. Cung cấp kiến thức thị trường tại TP.HCM (Quận 7, Quận 10, Quận 5, Bình Thạnh, Gò Vấp...).

HƯỚNG DẪN ĐẶC BIỆT (Ghi nhận nhu cầu):
- Nếu người dùng đang tìm phòng và bạn đã xác định được ít nhất 2 thông tin (Quận và Ngân sách), NHẤT ĐỊNH phải thêm một mã đặc biệt ở cuối câu trả lời của bạn theo định dạng sau:
  [LEAD_CAPTURE]{ "district": "Tên Quận", "maxPrice": 5000000, "amenities": ["wifi", "nóng lạnh"], "moveInDate": "2024-04-15" }[/LEAD_CAPTURE]
  (Chỉ xuất mã này MỘT LẦN khi bạn thấy đã đủ thông tin cơ bản).

HƯỚNG DẪN PHẢN HỒI:
- Nếu có THÔNG TIN PHÒNG đính kèm: Hãy dùng dữ liệu đó để trả lời khách và thúc đẩy việc đặt lịch xem (Booking).
- Nếu KHÔNG CÓ thông tin phòng: Hãy đóng vai trò "Người tìm phòng hộ". Hỏi khách về Quận muốn ở, Ngân sách, Tiện nghi cần thiết. Giải thích các ưu điểm khi dùng MapHome để tăng niềm tin.
- Luôn lịch sự, chân thành, chuyên nghiệp và dùng tiếng Việt.
`.trim();

const buildGroqMessages = (message, history = [], propertyContext = "") => {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  if (propertyContext) {
    messages.push({
      role: "system",
      content: `[DATA] ĐÂY LÀ THÔNG TIN PHÒNG HIỆN TẠI KHÁCH ĐANG XEM (SOURCE OF TRUTH):\n${propertyContext}`,
    });
  }

  history.forEach((msg) => {
    messages.push({ role: msg.role, content: msg.content });
  });

  messages.push({ role: "user", content: message });
  return messages;
};

exports.chatWithAI = async (req, res) => {
  try {
    const { message, history = [], propertyId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "INVALID_MESSAGE", message: "Tin nhắn không hợp lệ!" });
    }

    let propertyContext = "";
    if (propertyId) {
      try {
        const property = await Property.findById(propertyId);
        if (property) {
          propertyContext = `
            - Tên: ${property.name}
            - Địa chỉ: ${property.address}
            - Giá: ${property.price.toLocaleString("vi-VN")} VNĐ
            - Diện tích: ${property.area} m2
            - Tiện ích: ${Object.entries(property.amenities || {})
              .filter(([_, value]) => value === true)
              .map(([key]) => key)
              .join(", ")}
            - Chủ nhà: ${property.ownerName} (${property.phone})
            - Trạng thái: ${property.available ? "Còn phòng" : "Hết phòng"}
          `.trim();
        }
      } catch (err) {
        console.warn(`[AI] Could not fetch property ${propertyId}:`, err.message);
      }
    }

    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    if (!groqKey) throw new Error("GROQ_API_KEY_MISSING");

    const groq = new Groq({ apiKey: groqKey });
    
    // Limit history to last 10 messages
    const limitedHistory = history.slice(-10);
    const messages = buildGroqMessages(message, limitedHistory, propertyContext);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      stream: true,
      max_tokens: 1024,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (error) {
    console.error("[AI SYSTEM ERROR]", error.message);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "AI_SYSTEM_ERROR",
        message: error.message === "GROQ_API_KEY_MISSING" 
          ? "Hệ thống AI chưa được cấu hình Key!" 
          : "Hệ thống AI đang bận, thử lại sau!"
      });
    } else {
      res.end();
    }
  }
};