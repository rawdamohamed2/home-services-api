import AdminNotification from "./Adminnotification.model.js";
import {
  retryNotification,
  sendAdminNotification,
} from "./Adminnotification.service.js";
import { NotFoundError, ValidationError } from "../../core/utils/Errors.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import errorHandler from "../../core/middleware/Errorhandler.js";

// Compose + send or schedule a notification
export const composeNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      audience = "all_users",
      specificUserId,
      type = "info",
      scheduledAt,
    } = req.body;

    if (!title || !message)
      throw new ValidationError("title and message are required");
    if (audience === "specific_user" && !specificUserId)
      throw new ValidationError(
        "specificUserId is required when audience is specific_user",
      );

    const sendImmediately = !scheduledAt;

    const adminNotif = await AdminNotification.create({
      title,
      message,
      audience,
      specificUserId: specificUserId || null,
      type,
      status: sendImmediately ? "draft" : "scheduled",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdBy: req.user.id,
    });

    if (sendImmediately) {
      const { sentCount } = await sendAdminNotification(adminNotif);
      return ApiResponse.success(
        res,
        { adminNotif, sentCount },
        `Notification sent to ${sentCount} users`,
        201,
      );
    }

    ApiResponse.success(
      res,
      { adminNotif },
      `Notification scheduled for ${new Date(scheduledAt).toLocaleString()}`,
      201,
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// History with filters: status, type
export const getAdminNotifications = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await Promise.all([
      AdminNotification.find(filter)
        .populate("createdBy", "firstName lastName")
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AdminNotification.countDocuments(filter),
    ]);

    ApiResponse.sendPaginated(res, notifications, total, page, limit);
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const getAdminNotification = async (req, res) => {
  try {
    const notif = await AdminNotification.findById(req.params.id)
      .populate("createdBy", "firstName lastName")
      .populate("specificUserId", "firstName lastName email");

    if (!notif) throw new NotFoundError("Notification");

    ApiResponse.success(res, { notification: notif });
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// Can only cancel scheduled ones
export const cancelNotification = async (req, res) => {
  try {
    const notif = await AdminNotification.findById(req.params.id);
    if (!notif) throw new NotFoundError("Notification");

    if (notif.status !== "scheduled")
      throw new ValidationError(
        "Only scheduled notifications can be cancelled",
      );

    notif.status = "cancelled";
    await notif.save();

    ApiResponse.success(res, { notification: notif }, "Notification cancelled");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const duplicateNotification = async (req, res) => {
  try {
    const original = await AdminNotification.findById(req.params.id);
    if (!original) throw new NotFoundError("Notification");

    const duplicate = await AdminNotification.create({
      title: `${original.title} (Copy)`,
      message: original.message,
      audience: original.audience,
      specificUserId: original.specificUserId,
      type: original.type,
      status: "draft",
      scheduledAt: null,
      createdBy: req.user.id,
    });

    ApiResponse.success(
      res,
      { notification: duplicate },
      "Notification duplicated",
      201,
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const retryFailedNotification = async (req, res) => {
  try {
    const { sentCount } = await retryNotification(req.params.id);

    ApiResponse.success(
      res,
      { sentCount },
      `Notification retried successfully — sent to ${sentCount} users`,
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};
