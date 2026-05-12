const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderType: {
    type: String,
    enum: ['client', 'admin'],
    required: true
  },
  senderName: {
    type: String,
    trim: true,
    default: ''
  },
  senderId: {
    type: String,
    trim: true,
    default: ''
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  readByAdmin: {
    type: Boolean,
    default: false
  },
  readByClient: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
