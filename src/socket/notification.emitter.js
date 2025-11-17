import notificationService from "../services/notification.service.js";
import logger from "../config/logger.js";
import { getIoInstance } from "./socket.instance.js";

/**
 * Creates a notification and emits it via Socket.io
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createAndEmitNotification = async (notificationData) => {
  try {
    logger.info(
      `[Notification Emitter] Creating notification for user ${notificationData.userId}, type: ${notificationData.type}`
    );

    const notification = await notificationService.createNotification(
      notificationData
    );

    logger.info(
      `[Notification Emitter] Notification created in DB: ${notification.id}`
    );

    // Get io instance and emit notification to user via socket
    const io = getIoInstance();
    logger.info(
      `[Notification Emitter] Got io instance, emitting to room: ${notificationData.userId}`
    );

    io.to(notificationData.userId).emit("new_notification", notification);

    logger.info(
      `[Notification Emitter] ✓ Notification emitted to user ${notificationData.userId}: ${notificationData.type}`
    );
    return notification;
  } catch (error) {
    logger.error(
      "[Notification Emitter] ✗ Error creating and emitting notification:",
      error
    );
    throw error;
  }
};
