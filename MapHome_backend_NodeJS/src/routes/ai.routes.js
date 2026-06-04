const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Định tuyến cho AI Chat
// POST /api/ai/chat
router.post('/chat', aiController.chatWithAI);

module.exports = router;
