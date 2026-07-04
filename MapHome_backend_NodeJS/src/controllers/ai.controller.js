

// Địa chỉ của Python AI Service (mặc định là localhost:8000)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Vui lòng cung cấp 'message'" });
        }

        const resFetch = await fetch(`${AI_SERVICE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                history: history || []
            })
        });

        return res.status(resFetch.status).json(await resFetch.json());

    } catch (error) {
        console.error("Lỗi khi gọi AI Service:", error.message);
        console.error("Lỗi khi gọi AI Service:", error.message);
        return res.status(500).json({ error: "Không thể kết nối với AI Service" });
    }
};
