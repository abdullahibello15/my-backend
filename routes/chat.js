const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

// GET - all conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$message' },
          lastSenderType: { $first: '$senderType' },
          lastSenderName: { $first: '$senderName' },
          updatedAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$senderType', 'client'] }, { $eq: ['$readByAdmin', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);
    res.json(conversations.map((conversation) => ({
      conversationId: conversation._id,
      lastMessage: conversation.lastMessage,
      lastSenderType: conversation.lastSenderType,
      lastSenderName: conversation.lastSenderName,
      unreadCount: conversation.unreadCount,
      updatedAt: conversation.updatedAt
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - messages in a conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST - client sends a new message
router.post('/conversations', async (req, res) => {
  try {
    const { conversationId, message, senderName, clientId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const savedMessage = await Message.create({
      conversationId: conversationId || clientId || `conv-${Date.now()}`,
      senderType: 'client',
      senderName: senderName || 'Client',
      senderId: clientId || 'unknown',
      message: message,
      readByClient: true,
      readByAdmin: false
    });

    res.status(201).json({
      success: true,
      data: savedMessage
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST - admin replies to a conversation
router.post('/conversations/:conversationId/reply', async (req, res) => {
  try {
    const { message, senderName, adminId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const savedMessage = await Message.create({
      conversationId: req.params.conversationId,
      senderType: 'admin',
      senderName: senderName || 'Admin',
      senderId: adminId || 'admin',
      message: message,
      readByAdmin: true,
      readByClient: false
    });

    res.status(201).json({
      success: true,
      data: savedMessage
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
