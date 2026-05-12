const express = require('express');
const Message = require('../models/Message');

const router = express.Router();

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

module.exports = router;
