import notificationService from "../services/notification.service.js";
import logger from "../config/logger.js";
import { getIoInstance } from "./socket.instance.js";

/**
 * Creates a notification and emits it via Socket.io
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createAndEmitNotification = async (notificationData) => {
  const startTime = Date.now();
  try {
    logger.info(
      `[Notification Emitter] Creating notification for user ${notificationData.userId}, type: ${notificationData.type}, title: ${notificationData.title}`
    );

    const notification = await notificationService.createNotification(
      notificationData
    );

    const dbTime = Date.now();
    logger.info(
      `[Notification Emitter] ✓ Notification created in DB: ${notification.id} (${dbTime - startTime}ms)`
    );

    // Get io instance and emit notification to user via socket
    const io = getIoInstance();
    logger.info(
      `[Notification Emitter] Got io instance, emitting to room: ${notificationData.userId}`
    );

    io.to(notificationData.userId).emit("new_notification", notification);

    const emitTime = Date.now();
    logger.info(
      `[Notification Emitter] ✓ Notification emitted to user ${notificationData.userId}: ${notificationData.type} (${emitTime - dbTime}ms total: ${emitTime - startTime}ms)`
    );
    return notification;
  } catch (error) {
    const errorTime = Date.now();
    logger.error(
      `[Notification Emitter] ✗ Error creating and emitting notification after ${errorTime - startTime}ms:`,
      {
        userId: notificationData.userId,
        type: notificationData.type,
        error: error.message,
        stack: error.stack
      }
    );
    throw error;
  }
};
