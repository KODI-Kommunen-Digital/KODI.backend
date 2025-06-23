const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbot');
const authentication = require('../middlewares/authentication');
const sessionsRepo = require('../repository/userChatbotSessionsRepo');


// POST /chat/query - send a message to the chatbot and store the chat
router.post('/query', authentication, async (req, res) => {
    try {
        const userId = req.userId
        const { message, sessionId } = req.body;
        if (!message) return res.status(400).json({ error: 'message is required' });
        const result = await chatbotService.sendMessage({ userId, message, sessionId });
        return res.status(200).json({
            status: "success",
            data: result
        })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /chat/history/:sessionId - get chat history for a session
router.get('/history/:sessionId', authentication, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.userId
        const session = await sessionsRepo.getOne({ filters: [{ key: 'id', sign: '=', value: sessionId }, { key: 'userId', sign: '=', value: userId }] });
        if (!session) {
            throw new Error('Session not found')
        }
        const history = await chatbotService.getChatHistory(sessionId);
        return res.status(200).json({
            status: "success",
            data: history
        })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /chat/list/:userId - get chat list for a user
router.get('/list/:userId', authentication, async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.userId !== parseInt(userId)) {
            throw new Error("You don't have permission to access this resource")
        }
        const sessions = await chatbotService.getChatList(userId);
        return res.status(200).json({
            status: "success",
            data: sessions
        })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 