const axios = require('axios');

// Địa chỉ của Python AI Service (mặc định là localhost:8000)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Vui lòng cung cấp 'message'" });
        }

        // Gọi sang Python Service
        const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
            message,
            history: history || []
        });

        // Trả kết quả về cho Frontend
        return res.status(200).json(response.data);

    } catch (error) {
        console.error("Lỗi khi gọi AI Service:", error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ error: "Không thể kết nối với AI Service" });
    }
};
