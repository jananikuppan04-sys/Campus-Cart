const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth.protect, async (req, res) => {
    try {
        const { receiverId, productId, content } = req.body;

        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId || 'admin', // Default to admin if not specified
            productId,
            content,
            read: false,
            createdAt: new Date()
        });

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/messages
// @desc    Get my messages
// @access  Private
router.get('/', auth.protect, async (req, res) => {
    try {
        // Find messages where I am sender OR receiver
        // LowDB filter
        const messages = await Message.find({});
        // Manual filter because lowdb find() with OR is tricky in our MockQuery
        // Actually our MockQuery only supports simple structure.
        // Let's just get all and filter in JS for now for this mock scale

        const myMessages = messages.filter(m =>
            m.sender === req.user._id || m.receiver === req.user._id
        );

        // Sort by date desc
        myMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ success: true, count: myMessages.length, data: myMessages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
