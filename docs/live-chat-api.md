# Live Chat API

Base URL:

```text
http://localhost:3000
```

Socket URL:

```text
ws://localhost:3000
```

## Stored Message Endpoints

### List Admin Conversations

```http
GET /api/chat/conversations
```

Returns the latest message per conversation, newest first.

### List Messages In A Conversation

```http
GET /api/chat/conversations/:conversationId/messages
```

Returns all stored MongoDB messages for one conversation, oldest first.

## Socket Events

### Client Join

```js
socket.emit('client:join', {
  conversationId: 'user_123'
});
```

Response:

```js
socket.on('client:joined', ({ conversationId }) => {
  console.log(conversationId);
});
```

### Client Sends Message

```js
socket.emit('client:send_message', {
  conversationId: 'user_123',
  clientId: 'user_123',
  senderName: 'John Doe',
  message: 'Hello admin'
});
```

The admin portal receives:

```js
socket.on('admin:new_message', (message) => {
  console.log(message);
});
```

The client conversation receives:

```js
socket.on('chat:new_message', (message) => {
  console.log(message);
});
```

### Admin Join

```js
socket.emit('admin:join');
```

Response:

```js
socket.on('admin:joined', ({ room }) => {
  console.log(room);
});
```

### Admin Sends Reply

```js
socket.emit('admin:send_message', {
  conversationId: 'user_123',
  adminId: 'admin_1',
  senderName: 'Admin',
  message: 'How can I help?'
});
```

The client receives:

```js
socket.on('chat:new_message', (message) => {
  console.log(message);
});
```

### Typing Indicator

```js
socket.emit('chat:typing', {
  conversationId: 'user_123',
  senderType: 'client',
  senderName: 'John Doe'
});
```

Listen:

```js
socket.on('chat:typing', (payload) => {
  console.log(payload);
});
```

### Errors

```js
socket.on('chat:error', ({ error }) => {
  console.error(error);
});
```

## Browser Client Example

Install in the frontend:

```bash
npm install socket.io-client
```

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.emit('client:join', {
  conversationId: currentUser.id
});

socket.on('chat:new_message', (message) => {
  console.log('message for this client', message);
});

function sendMessage(text) {
  socket.emit('client:send_message', {
    conversationId: currentUser.id,
    clientId: currentUser.id,
    senderName: currentUser.name,
    message: text
  });
}
```

## Admin Portal Example

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.emit('admin:join');

socket.on('admin:new_message', (message) => {
  console.log('message for admin portal', message);
});

function reply(conversationId, text) {
  socket.emit('admin:send_message', {
    conversationId,
    adminId: admin.id,
    senderName: admin.name || 'Admin',
    message: text
  });
}
```
