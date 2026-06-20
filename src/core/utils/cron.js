import cron from "node-cron";
import BookingAssignment from "../../modules/bookingAssignment/BookingAssignment.model.js";
import {
  processFailedRetries,
  processPendingScheduled,
} from "../../modules/AdminNotification/Adminnotification.service.js";
import {
  processExpiringSubscriptions,
  processExpiredSubscriptions,
} from "../../modules/SubscriptionPlans/subscription.service.js";
import SupportTicket from "../../modules/support/SupportTicket.model.js";
import { notifyTicketClosed } from "../../modules/notifications/Notification.service.js";

export const startCronJobs = () => {
  // Every 5 min — expire stale assignments
  cron.schedule("*/5 * * * *", async () => {
    try {
      const count = await BookingAssignment.expireOldAssignments();
      if (count > 0)
        console.log(
          `[CRON]  Expired ${count} assignment(s) at ${new Date().toISOString()}`,
        );
    } catch (err) {
      console.error("[CRON]  expire assignments:", err.message);
    }
  });

  // Every 1 min — send scheduled admin notifications
  cron.schedule("* * * * *", async () => {
    try {
      const count = await processPendingScheduled();
      if (count > 0)
        console.log(`[CRON]  Sent ${count} scheduled notification(s)`);
    } catch (err) {
      console.error("[CRON]  scheduled notifications:", err.message);
    }
  });

  cron.schedule("*/10 * * * *", async () => {
    try {
      const count = await processFailedRetries();
      if (count > 0)
        console.log(`[CRON]  Retried ${count} failed notification(s)`);
    } catch (err) {
      console.error("[CRON]  retry notifications:", err.message);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    try {
      const expiringCount = await processExpiringSubscriptions();
      const expiredCount = await processExpiredSubscriptions();

      if (expiringCount > 0)
        console.log(
          `[CRON]  Notified ${expiringCount} expiring subscription(s)`,
        );
      if (expiredCount > 0)
        console.log(
          `[CRON]  Processed ${expiredCount} expired subscription(s)`,
        );
    } catch (err) {
      console.error("[CRON]  subscriptions processing:", err.message);
    }
  });

  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running auto-close tickets job...");

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const expiredTickets = await SupportTicket.find({
        status: { $nin: ["closed", "resolved"] },
        updatedAt: { $lte: twentyFourHoursAgo }, // أو استخدم lastMessageAt لو عندك
      });

      for (const ticket of expiredTickets) {
        ticket.status = "closed";
        ticket.closeReason =
          "Closed automatically due to inactivity for 24 hours";
        await ticket.save();

        await notifyTicketClosed(
          ticket.user,
          { ticketId: ticket._id.toString() },
          { subject: ticket.subject },
        );

        console.log(`Ticket ${ticket._id} closed automatically.`);
      }
    } catch (error) {
      console.error("Error in auto-close tickets cron job:", error);
    }
  });

  console.log("⏰ Cron jobs started");
};
