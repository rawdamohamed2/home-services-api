export const EVENTS = {
  NEW_OFFER: "offer:new",
  OFFER_EXPIRED: "offer:expired",
  USER_ACCEPTED: "offer:user_accepted",
  USER_REJECTED: "offer:user_rejected",
  BOOKING_CANCELLED: "booking:cancelled",
  BOOKING_UPDATED: "booking:updated",

  COUNTER_OFFER: "offer:counter",
  BOOKING_ACCEPTED: "booking:accepted",
  BOOKING_COMPLETED: "booking:completed",
  WORKER_ASSIGNED: "booking:assigned",

  NOTIFICATION: "notification:new",
  NEW_MESSAGE: "message:new",

  WORKER_LOCATION: "worker:location",
  TRACKING_SUBSCRIBE: "tracking:subscribe",
  TRACKING_UNSUBSCRIBE: "tracking:unsubscribe",
  WORKER_UPDATE_LOCATION: "worker:update_location",

  PAYMENT_RECEIVED: "payment:received",
  PAYMENT_PENDING: "payment:pending_verification",
  PAYMENT_FAILED: "payment:failed",
  PAYMENT_REFUNDED: "payment:refunded",
  EARNINGS_PENDING: "earnings:pending",
  EARNINGS_RELEASED: "earnings:released",
  WITHDRAWAL_REQUESTED: "withdrawal:requested",
  WITHDRAWAL_APPROVED: "withdrawal:approved",
  WITHDRAWAL_REJECTED: "withdrawal:rejected",
  WITHDRAWAL_PAID: "withdrawal:paid",

  REVIEW_RECEIVED: "review:received",
  COMMENT_REMOVED: "review:comment_removed",
  USER_MUTED: "user:muted",

  SUBSCRIPTION_STARTED: "subscription:started",
  SUBSCRIPTION_CANCELLED: "subscription:cancelled",
  SUBSCRIPTION_RENEWED: "subscription:renewed",
  SUBSCRIPTION_EXPIRING: "subscription:expiring",
  SUBSCRIPTION_EXPIRED: "subscription:expired",
};
