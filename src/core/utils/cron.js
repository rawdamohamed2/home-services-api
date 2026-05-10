// src/core/utils/cron.js
import cron from "node-cron";
import BookingAssignment from "../../modules/bookingAssignment/BookingAssignment.model.js";

export const startCronJobs = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const count = await BookingAssignment.expireOldAssignments();
      if (count > 0) {
        console.log(
          `[CRON] Expired ${count} assignment(s) at ${new Date().toISOString()}`,
        );
      }
    } catch (error) {
      console.error("[CRON]  Error expiring assignments:", error.message);
    }
  });

  console.log("⏰ Cron jobs started");
};
