import cron from "node-cron";
import BookingAssignment from "../../modules/bookingAssignment/BookingAssignment.model.js";
import {
  processFailedRetries,
  processPendingScheduled,
} from "../../modules/AdminNotification/Adminnotification.service.js";

export const startCronJobs = () => {
  // Every 5 min — expire stale assignments
  cron.schedule("*/5 * * * *", async () => {
    try {
      const count = await BookingAssignment.expireOldAssignments();
      if (count > 0)
        console.log(
          `[CRON] ✅ Expired ${count} assignment(s) at ${new Date().toISOString()}`,
        );
    } catch (err) {
      console.error("[CRON] ❌ expire assignments:", err.message);
    }
  });

  // Every 1 min — send scheduled admin notifications
  cron.schedule("* * * * *", async () => {
    try {
      const count = await processPendingScheduled();
      if (count > 0)
        console.log(`[CRON] 📢 Sent ${count} scheduled notification(s)`);
    } catch (err) {
      console.error("[CRON] ❌ scheduled notifications:", err.message);
    }
  });

  cron.schedule("*/10 * * * *", async () => {
    try {
      const count = await processFailedRetries();
      if (count > 0)
        console.log(`[CRON] 🔄 Retried ${count} failed notification(s)`);
    } catch (err) {
      console.error("[CRON] ❌ retry notifications:", err.message);
    }
  });

  console.log("⏰ Cron jobs started");
};
