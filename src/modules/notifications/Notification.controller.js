import Notification from "./Notification.model.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import errorHandler from "../../core/middleware/Errorhandler.js";
import { NotFoundError } from "../../core/utils/Errors.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const result = await Notification.getUserNotifications(req.user.id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      isRead:
        req.query.isRead !== undefined ? req.query.isRead === "true" : null,
      type: req.query.type || null,
    });

    ApiResponse.sendPaginated(
      res,
      result.notifications,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit,
      { unreadCount: result.unreadCount },
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });
    ApiResponse.success(res, { unreadCount: count });
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!notification) throw new NotFoundError("Notification");

    await notification.markAsRead();
    ApiResponse.success(res, { notification }, "Marked as read");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);
    ApiResponse.success(
      res,
      { updated: result.modifiedCount },
      "All notifications marked as read",
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!notification) throw new NotFoundError("Notification");

    ApiResponse.success(res, null, "Notification deleted");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// DELETE /api/notifications (delete all for user)
export const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user.id });
    ApiResponse.success(
      res,
      { deleted: result.deletedCount },
      "All notifications deleted",
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};
