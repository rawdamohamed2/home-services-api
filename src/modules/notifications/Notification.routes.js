import { Router } from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "./Notification.controller.js";

const notificationsRouter = Router();
notificationsRouter.use(protect);

notificationsRouter.get("/", getNotifications);
notificationsRouter.get("/unread-count", getUnreadCount);
notificationsRouter.patch("/read-all", markAllAsRead);
notificationsRouter.patch("/:id/read", markAsRead);
notificationsRouter.delete("/", deleteAllNotifications);
notificationsRouter.delete("/:id", deleteNotification);

export default notificationsRouter;
