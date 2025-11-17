import notificationService from "../services/notification.service.js";
import logger from "../config/logger.js";

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const notifications = await notificationService.getUserNotifications(
      userId,
      limit
    );
    const unreadCount = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    logger.error("Error in getNotifications:", error);
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    logger.error("Error in getUnreadCount:", error);
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await notificationService.markAsRead(notificationId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    logger.error("Error in markAsRead:", error);
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    logger.error("Error in markAllAsRead:", error);
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const deleted = await notificationService.deleteNotification(
      notificationId,
      userId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    logger.error("Error in deleteNotification:", error);
    next(error);
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
