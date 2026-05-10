import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title too long"],
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      trim: true,
      maxlength: [500, "Body too long"],
    },
    type: {
      type: String,
      enum: {
        values: [
          "booking_created",
          "booking_accepted",
          "booking_completed",
          "booking_cancelled",
          "payment_received",
          "payment_released",
          "new_message",
          "review_received",
          "worker_assigned",
          "subscription_expiring",
          "subscription_expired",
          "wallet_credited",
          "wallet_debited",
          "withdrawal_status",
          "admin_announcement",
          "system",
        ],
        message: "Invalid notification type",
      },
      required: [true, "Notification type is required"],
    },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
); // Auto-delete after 30 days

// Virtual للتنسيق
notificationSchema.virtual("timeAgo").get(function () {
  const diff = Date.now() - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} يوم`;
  if (hours > 0) return `${hours} ساعة`;
  if (minutes > 0) return `${minutes} دقيقة`;
  return "الآن";
});

// Method لتعليم كمقروء
notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Method لتعليم كمقروء (static)
notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );
};

// Method لإنشاء إشعار
notificationSchema.statics.createNotification = async function (data) {
  return await this.create(data);
};

// Method لإنشاء إشعارات متعددة (للأدمن)
notificationSchema.statics.createBulk = async function (notifications) {
  return await this.insertMany(notifications);
};

// Method لجلب إشعارات المستخدم
notificationSchema.statics.getUserNotifications = async function (
  userId,
  options = {},
) {
  const {
    page = 1,
    limit = 20,
    isRead = null,
    type = null,
    includeDeleted = false,
  } = options;

  const query = {};
  query.user = userId;
  if (!includeDeleted) query.isDeleted = false;
  if (isRead !== null) query.isRead = isRead;
  if (type) query.type = type;
  console.log(userId);
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    this.find(query).sort("-createdAt").skip(skip).limit(limit).lean(),
    this.countDocuments(query),
    this.countDocuments({ user: userId, isRead: false, isDeleted: false }),
  ]);
  console.log(notifications);
  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    unreadCount,
  };
};

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
export default Notification;
