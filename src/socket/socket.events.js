export const EVENTS = {
  // ── Server → Worker ───────────────────────────────────────────────
  NEW_OFFER: "offer:new", // new booking offer arrived
  OFFER_EXPIRED: "offer:expired", // offer window closed
  USER_ACCEPTED: "offer:user_accepted", // user accepted counter price
  USER_REJECTED: "offer:user_rejected", // user rejected counter price
  BOOKING_CANCELLED: "booking:cancelled", // booking was cancelled

  // ── Server → User ─────────────────────────────────────────────────
  COUNTER_OFFER: "offer:counter", // worker proposed new price
  BOOKING_ACCEPTED: "booking:accepted", // worker accepted at original price
  BOOKING_COMPLETED: "booking:completed", // service done
  WORKER_ASSIGNED: "booking:assigned", // final worker confirmed

  // ── General ───────────────────────────────────────────────────────
  NOTIFICATION: "notification:new", // any new DB notification
};
