const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./database");
const setupChatSocket = require("./sockets/chatSocket");

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "🚀 Server is running!" });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api", require("./routes/balance")); // Balance routes

const { chatEvents } = setupChatSocket(server);

chatEvents.on("message:created", (message) => {
  console.log(
    `💬 New ${message.senderType} message in ${message.conversationId}`,
  );

  if (message.senderType === "client") {
    io.to(ADMIN_ROOM).emit("admin:new_message", message);
  }

  if (message.senderType === "admin") {
    io.to(message.conversationId).emit("chat:new_message", message);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
