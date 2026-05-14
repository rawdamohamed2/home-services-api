import { Router } from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import {
  getNotifications,
  getNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "./Notification.controller.js";
import { validate } from "../../core/middleware/validate.js";
import { idValidation } from "./Notification.validation.js";

const notificationsRouter = Router();
notificationsRouter.use(protect);

notificationsRouter.get("/", getNotifications);
notificationsRouter.get("/:id", validate(idValidation), getNotification);
notificationsRouter.get("/unread-count", getUnreadCount);
notificationsRouter.patch("/read-all", markAllAsRead);
notificationsRouter.patch("/:id/read", markAsRead);
notificationsRouter.delete("/", deleteAllNotifications);
notificationsRouter.delete("/:id", deleteNotification);

export default notificationsRouter;
