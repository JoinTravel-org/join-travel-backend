import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import app from "./app.js";
import config from "./config/index.js";
import logger from "./config/logger.js";
import { AppDataSource } from "./load/typeorm.loader.js";
import directMessageService from "./services/directMessage.service.js";

import connectDB from "./load/database.loader.js";
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  },
  serveClient: false
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }

  // Check if token is a string (ignore non-string tokens like probes)
  if (typeof token !== 'string') {
    logger.warn('Socket connection ignored: Invalid token format (non-string)');
    return next(new Error('Authentication error: Invalid token format'));
  }

  // Check if it looks like a JWT (starts with 'eyJ')
  if (!token.startsWith('eyJ')) {
    logger.warn('Socket connection rejected: Token does not look like JWT');
    return next(new Error('Authentication error: Invalid token format'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    logger.error(`Socket authentication failed for token ${token.substring(0, 20)}...:`, err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  logger.info(`User ${userId} connected via socket`);

  // Join user's own room for targeted messaging
  socket.join(userId);

  socket.on('send_message', async (data) => {
    try {
      const { receiverId, content } = data;
      
      if (!receiverId || !content) {
        return socket.emit('message_error', { error: 'Receiver ID and content are required' });
      }

      const result = await directMessageService.sendMessage({
        senderId: userId,
        receiverId,
        content
      });

      const message = result.data;

      // Emit to receiver (new message)
      io.to(receiverId).emit('new_message', message);

      // Emit confirmation to sender
      socket.emit('message_sent', message);

      logger.info(`Message sent from ${userId} to ${receiverId}`);
    } catch (error) {
      logger.error('Error sending message via socket:', error.message);
      socket.emit('message_error', { error: error.message || 'Failed to send message' });
    }
  });

  socket.on('mark_as_read', async (data) => {
    try {
      const { otherUserId } = data;

      if (!otherUserId) {
        return socket.emit('message_error', { error: 'Other user ID is required' });
      }

      await directMessageService.markAsRead(userId, otherUserId);

      // Emit to the other user that messages were read
      io.to(otherUserId).emit('messages_read', { userId });

      logger.info(`User ${userId} marked messages as read for ${otherUserId}`);
    } catch (error) {
      logger.error('Error marking messages as read via socket:', error.message);
      socket.emit('message_error', { error: error.message || 'Failed to mark as read' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User ${userId} disconnected from socket`);
  });
});

const PORT = config.port;

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    logger.info(`Socket.io server initialized on port ${PORT}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);

      // Close Socket.io
      io.close(() => {
        logger.info('Socket.io server closed');
      });

      // Close HTTP server
      server.close(async () => {
          logger.info('HTTP server closed');

          // Close database connection
          try {
              if (AppDataSource.isInitialized) {
                  await AppDataSource.destroy();
                  logger.info('Database connection closed');
              }
          } catch (error) {
              logger.error('Error closing database connection:', error);
          }

          logger.info('Process terminated');
          process.exit(0);
      });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
