import { AppDataSource } from "../load/typeorm.loader.js";
import Notification from "../models/notification.model.js";
import logger from "../config/logger.js";

const notificationRepository = AppDataSource.getRepository(Notification);

export const createNotification = async (notificationData) => {
  try {
    const notification = notificationRepository.create(notificationData);
    await notificationRepository.save(notification);
    return notification;
  } catch (error) {
    logger.error("Error creating notification:", error);
    throw error;
  }
};

export const getUserNotifications = async (userId, limit = 50) => {
  try {
    const notifications = await notificationRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
    });
    return notifications;
  } catch (error) {
    logger.error("Error getting user notifications:", error);
    throw error;
  }
};

export const getUnreadCount = async (userId) => {
  try {
    const count = await notificationRepository.count({
      where: { userId, read: false },
    });
    return count;
  } catch (error) {
    logger.error("Error getting unread count:", error);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    await notificationRepository.update(notificationId, { read: true });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    throw error;
  }
};

export const markAllAsRead = async (userId) => {
  try {
    await notificationRepository.update(
      { userId, read: false },
      { read: true }
    );
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    throw error;
  }
};

export const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await notificationRepository.delete({
      id: notificationId,
      userId,
    });
    return result.affected > 0;
  } catch (error) {
    logger.error("Error deleting notification:", error);
    throw error;
  }
};

export default {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
