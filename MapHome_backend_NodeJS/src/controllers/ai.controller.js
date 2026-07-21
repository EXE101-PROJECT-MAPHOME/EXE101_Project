const Property = require('../models/Property');

// Địa chỉ của Python AI Service (mặc định là localhost:8000)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history, propertyId, provider, model } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Vui lòng cung cấp 'message'" });
        }

        let propertyContext = null;
        if (propertyId) {
            try {
                const property = await Property.findById(propertyId).select('name description address price area amenities status rating ratingCount ownerName');
                if (property) {
                    propertyContext = property;
                }
            } catch (err) {
                console.error("Lỗi khi tìm phòng (Property):", err.message);
            }
        }

        const resFetch = await fetch(`${AI_SERVICE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
                message,
                history: history || [],
                propertyContext,
                provider: provider || 'auto',
                model: model || null
            })
        });

        if (!resFetch.ok) {
            const errBody = await resFetch.text();
            console.error("Lỗi HTTP từ AI Service:", resFetch.status, errBody);
            return res.status(resFetch.status).json({ error: "Lỗi từ AI Service" });
        }

        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        if (!resFetch.body) {
             return res.status(500).json({ error: "No response body from AI" });
        }

        const reader = resFetch.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
        }

        res.end();

    } catch (error) {
        console.error("Lỗi khi gọi AI Service:", error.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Không thể kết nối với AI Service" });
        } else {
            res.write(`data: ${JSON.stringify({ content: "\\n\\n[LỖI] Kết nối bị gián đoạn." })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
        }
    }
};
