const { Server } = require('socket.io');
const EventEmitter = require('events');
const Message = require('../models/Message');

const chatEvents = new EventEmitter();

const ADMIN_ROOM = 'admins';

const formatMessage = (message) => ({
  id: message._id,
  conversationId: message.conversationId,
  senderType: message.senderType,
  senderName: message.senderName,
  senderId: message.senderId,
  message: message.message,
  readByAdmin: message.readByAdmin,
  readByClient: message.readByClient,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt
});

const buildConversationId = (socket, payload) => {
  return payload.conversationId || payload.clientId || socket.id;
};

const setupChatSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.on('admin:join', () => {
      socket.join(ADMIN_ROOM);
      socket.emit('admin:joined', { room: ADMIN_ROOM });
    });

    socket.on('client:join', (payload = {}) => {
      const conversationId = buildConversationId(socket, payload);
      socket.join(conversationId);
      socket.emit('client:joined', { conversationId });
    });

    socket.on('client:send_message', async (payload = {}) => {
      try {
        if (!payload.message || !payload.message.trim()) {
          return socket.emit('chat:error', { error: 'Message is required' });
        }

        const conversationId = buildConversationId(socket, payload);
        socket.join(conversationId);

        const savedMessage = await Message.create({
          conversationId,
          senderType: 'client',
          senderName: payload.senderName || 'Client',
          senderId: payload.clientId || socket.id,
          message: payload.message,
          readByClient: true
        });

        const eventPayload = formatMessage(savedMessage);
        chatEvents.emit('message:created', eventPayload);
        io.to(conversationId).emit('chat:new_message', eventPayload);
        io.to(ADMIN_ROOM).emit('admin:new_message', eventPayload);
      } catch (err) {
        socket.emit('chat:error', { error: 'Could not send message' });
      }
    });

    socket.on('admin:send_message', async (payload = {}) => {
      try {
        if (!payload.conversationId) {
          return socket.emit('chat:error', { error: 'Conversation ID is required' });
        }

        if (!payload.message || !payload.message.trim()) {
          return socket.emit('chat:error', { error: 'Message is required' });
        }

        const savedMessage = await Message.create({
          conversationId: payload.conversationId,
          senderType: 'admin',
          senderName: payload.senderName || 'Admin',
          senderId: payload.adminId || socket.id,
          message: payload.message,
          readByAdmin: true
        });

        const eventPayload = formatMessage(savedMessage);
        chatEvents.emit('message:created', eventPayload);
        io.to(payload.conversationId).emit('chat:new_message', eventPayload);
        io.to(ADMIN_ROOM).emit('admin:new_message', eventPayload);
      } catch (err) {
        socket.emit('chat:error', { error: 'Could not send message' });
      }
    });

    socket.on('chat:typing', (payload = {}) => {
      if (!payload.conversationId) return;
      socket.to(payload.conversationId).emit('chat:typing', {
        conversationId: payload.conversationId,
        senderType: payload.senderType || 'client',
        senderName: payload.senderName || ''
      });
    });
  });

  return { io, chatEvents };
};

module.exports = setupChatSocket;
