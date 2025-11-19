import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import notificationController from "../controllers/notification.controller.js";

const router = Router();

// Get user notifications
router.get("/", authenticate, notificationController.getNotifications);

// Get unread count
router.get(
  "/unread/count",
  authenticate,
  notificationController.getUnreadCount
);

// Mark notification as read
router.patch(
  "/:notificationId/read",
  authenticate,
  notificationController.markAsRead
);

// Mark all as read
router.patch("/read/all", authenticate, notificationController.markAllAsRead);

// Delete notification
router.delete(
  "/:notificationId",
  authenticate,
  notificationController.deleteNotification
);

export default router;
