import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 500 },

    audience: {
      type: String,
      enum: ["all_users", "all_workers", "specific_user"],
      default: "all_users",
    },
    specificUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },

    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed", "cancelled"],
      default: "draft",
    },

    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    sentCount: { type: Number, default: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

adminNotificationSchema.index({ status: 1, scheduledAt: 1 });
adminNotificationSchema.index({ createdBy: 1, createdAt: -1 });

adminNotificationSchema.methods.canRetry = function () {
  return this.status === "failed" && this.retryCount < this.maxRetries;
};

adminNotificationSchema.methods.markFailed = async function (errorMsg) {
  this.status = "failed";
  this.lastErrorMsg = errorMsg;
  this.retryCount += 1;

  if (this.retryCount < this.maxRetries) {
    // Exponential backoff: 5min, 15min, 45min
    const delayMinutes = Math.pow(3, this.retryCount) * 5;
    this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  } else {
    this.nextRetryAt = null; // استنفذ كل المحاولات
  }

  await this.save();
  return this;
};

const AdminNotification =
  mongoose.models.AdminNotification ||
  mongoose.model("AdminNotification", adminNotificationSchema);

export default AdminNotification;
