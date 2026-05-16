import mongoose from "mongoose";
import AdminNotification from "./Adminnotification.model.js";
import Notification from "../notifications/Notification.model.js";
import { emitToUser } from "../../socket/socket.js";
import { EVENTS } from "../../socket/socket.events.js";
import { sendFCMBulk } from "../../core/firebase/fcm.js";

const resolveAudience = async (audience, specificUserId) => {
  const User = mongoose.model("User");

  if (audience === "specific_user") {
    if (!specificUserId) return [];
    const user = await User.findById(specificUserId)
      .select("_id fcmToken")
      .lean();
    console.log(user);
    return user ? [user] : [];
  }

  const roleFilter = audience === "all_workers" ? "worker" : "user";
  const users = await User.find({ role: roleFilter, isBlocked: false })
    .select("_id fcmToken")
    .lean();
  console.log(users);
  return users;
};

export const sendAdminNotification = async (adminNotif) => {
  const users = await resolveAudience(
    adminNotif.audience,
    adminNotif.specificUserId,
  );

  if (!users.length) return { sentCount: 0 };

  const userIds = users.map((u) => u._id);
  const fcmTokens = users.map((u) => u.fcmToken).filter(Boolean);

  await Notification.insertMany(
    userIds.map((userId) => ({
      user: userId,
      title: adminNotif.title,
      message: adminNotif.message,
      type: "admin_announcement",
      metadata: {
        adminNotifId: adminNotif._id,
        notifType: adminNotif.type,
        audience: adminNotif.audience,
      },
    })),
    { ordered: false },
  );

  const socketPromises = userIds.map((userId) =>
    emitToUser(userId, EVENTS.NOTIFICATION, {
      notification: {
        title: adminNotif.title,
        body: adminNotif.message,
        type: "admin_announcement",
        notifType: adminNotif.type,
      },
    }),
  );
  await Promise.all(socketPromises);

  if (fcmTokens.length > 0) {
    try {
      await sendFCMBulk(fcmTokens, {
        title: adminNotif.title,
        body: adminNotif.message,
        data: {
          type: "admin_announcement",
          notifType: adminNotif.type,
          adminNotifId: adminNotif._id.toString(),
        },
      });
    } catch (fcmErr) {
      console.error(`[AdminNotif FCM Error]`, fcmErr.message);
    }
  }

  await AdminNotification.findByIdAndUpdate(adminNotif._id, {
    status: "sent",
    sentAt: new Date(),
    sentCount: userIds.length,
  });

  return { sentCount: userIds.length };
};

export const processPendingScheduled = async () => {
  const due = await AdminNotification.find({
    status: "scheduled",
    scheduledAt: { $lte: new Date() },
  });

  for (const notif of due) {
    try {
      await sendAdminNotification(notif);
    } catch (err) {
      await AdminNotification.findByIdAndUpdate(notif._id, {
        status: "failed",
      });
      console.error(`[AdminNotif] Failed ${notif._id}:`, err.message);
    }
  }

  return due.length;
};

export const processFailedRetries = async () => {
  const due = await AdminNotification.find({
    status: "failed",
    nextRetryAt: { $lte: new Date() },
    $expr: { $lt: ["$retryCount", "$maxRetries"] },
  });

  let retried = 0;

  for (const notif of due) {
    try {
      console.log(
        `[AdminNotif] 🔄 Retrying ${notif._id} (attempt ${notif.retryCount + 1}/${notif.maxRetries})`,
      );
      await sendAdminNotification(notif);
      retried++;
    } catch (err) {
      await notif.markFailed(err.message);
      console.error(`[AdminNotif] ❌ Retry failed ${notif._id}:`, err.message);
    }
  }

  return retried;
};

export const retryNotification = async (adminNotifId) => {
  const notif = await AdminNotification.findById(adminNotifId);

  if (!notif) throw new Error("Notification not found");

  if (notif.status !== "failed") {
    throw new Error(`Cannot retry — current status is '${notif.status}'`);
  }

  if (!notif.canRetry()) {
    throw new Error(
      `Max retries (${notif.maxRetries}) reached. Last error: ${notif.lastErrorMsg}`,
    );
  }

  return await sendAdminNotification(notif);
};
