const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/sessions', chatController.getSessions);
router.post('/sessions', chatController.createOrUpdateSession);
router.get('/sessions/:id', chatController.getSession);
router.delete('/sessions/:id', chatController.deleteSession);

module.exports = router;
