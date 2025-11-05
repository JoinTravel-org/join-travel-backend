import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import config from "./index.js";
import logger from "./logger.js";
import directMessageService from "../services/directMessage.service.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.frontendUrl || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware de autenticación
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      logger.warn("Socket connection attempt without token");
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      logger.info(`Socket authenticated for user: ${decoded.id}`);
      next();
    } catch (err) {
      logger.error("Socket authentication failed:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Unir al usuario a su sala personal
    socket.join(`user:${socket.userId}`);

    // Evento para enviar mensaje
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, content } = data;

        logger.info(`Sending message from ${socket.userId} to ${receiverId}`);

        // Guardar mensaje en la base de datos
        const result = await directMessageService.sendMessage({
          senderId: socket.userId,
          receiverId,
          content,
        });

        if (result.success) {
          // Enviar el mensaje al emisor
          socket.emit("message_sent", result.data);

          // Enviar el mensaje al receptor si está conectado
          io.to(`user:${receiverId}`).emit("new_message", result.data);

          logger.info(`Message sent from ${socket.userId} to ${receiverId}`);
        }
      } catch (error) {
        logger.error("Error sending message:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // Evento para marcar mensajes como leídos
    socket.on("mark_as_read", async (data) => {
      try {
        const { otherUserId } = data;
        await directMessageService.markConversationAsRead(
          socket.userId,
          otherUserId
        );

        // Notificar al otro usuario que los mensajes fueron leídos
        io.to(`user:${otherUserId}`).emit("messages_read", {
          userId: socket.userId,
        });
      } catch (error) {
        logger.error("Error marking messages as read:", error);
      }
    });

    // Evento de desconexión
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
