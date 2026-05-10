import Notification from "./Notification.model.js";
import { emitToUser } from "../../socket/socket.js";
import { EVENTS } from "../../socket/socket.events.js";

const MESSAGES = {
  booking_created: {
    title: "Booking Created",
    body: (d) =>
      `Your booking for ${d.serviceName} has been created successfully.`,
  },
  booking_accepted: {
    title: "Booking Accepted!",
    body: (d) => `${d.workerName} accepted your booking for ${d.serviceName}.`,
  },
  booking_completed: {
    title: "Booking Completed",
    body: (d) =>
      `Your ${d.serviceName} booking is complete. Rate your experience!`,
  },
  booking_cancelled: {
    title: "Booking Cancelled",
    body: (d) => `Your booking for ${d.serviceName} has been cancelled.`,
  },
  counter_offer_received: {
    title: "New Price Offer",
    body: (d) =>
      `${d.workerName} proposed ${d.counterPrice} L.E (was ${d.originalPrice} L.E).`,
  },
  counter_offer_accepted: {
    title: "Offer Accepted!",
    body: (d) =>
      `The user accepted your price of ${d.finalPrice} L.E. Get ready!`,
  },
  counter_offer_rejected: {
    title: "Offer Rejected",
    body: (d) =>
      `The user rejected your counter offer of ${d.counterPrice} L.E.`,
  },
  new_booking_offer: {
    title: "New Booking Request",
    body: (d) =>
      `New ${d.serviceName} request near you — ${d.price} L.E. Respond within 30 min!`,
  },
  worker_assigned: {
    title: "You're Assigned!",
    body: (d) =>
      `You've been assigned to ${d.serviceName} on ${d.scheduledDate}.`,
  },
  payment_received: {
    title: "Payment Received",
    body: (d) => `Payment of ${d.amount} L.E received for ${d.serviceName}.`,
  },
  wallet_credited: {
    title: "Wallet Credited",
    body: (d) => `${d.amount} L.E added to your wallet.`,
  },
  wallet_debited: {
    title: "Wallet Debited",
    body: (d) => `${d.amount} L.E deducted from your wallet.`,
  },
};

const SOCKET_EVENT_MAP = {
  new_booking_offer: EVENTS.NEW_OFFER,
  counter_offer_received: EVENTS.COUNTER_OFFER,
  counter_offer_accepted: EVENTS.USER_ACCEPTED,
  counter_offer_rejected: EVENTS.USER_REJECTED,
  booking_accepted: EVENTS.BOOKING_ACCEPTED,
  booking_cancelled: EVENTS.BOOKING_CANCELLED,
  booking_completed: EVENTS.BOOKING_COMPLETED,
  worker_assigned: EVENTS.WORKER_ASSIGNED,
};

export const sendNotification = async (userId, type, data = {}) => {
  const template = MESSAGES[type];
  if (!template) {
    console.warn(`[Notification] Unknown type: ${type}`);
    return null;
  }

  // 1. Save to DB
  const notification = await Notification.create({
    user: userId,
    type: type in Notification.schema.path("type").enumValues ? type : "system",
    title: template.title,
    body: template.body(data),
  });

  // 2. Emit socket event in real-time
  const socketEvent = SOCKET_EVENT_MAP[type] || EVENTS.NOTIFICATION;
  emitToUser(userId, socketEvent, {
    notification: {
      _id: notification._id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      createdAt: notification.createdAt,
    },
    // Extra data for UI to act on immediately
    ...data,
  });

  return notification;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const notifyBookingCreated = (userId, data) =>
  sendNotification(userId, "booking_created", data);

export const notifyBookingAccepted = (userId, data) =>
  sendNotification(userId, "booking_accepted", data);

export const notifyBookingCancelled = (userId, data) =>
  sendNotification(userId, "booking_cancelled", data);

export const notifyBookingCompleted = (userId, data) =>
  sendNotification(userId, "booking_completed", data);

export const notifyNewOffer = (userId, data) =>
  sendNotification(userId, "new_booking_offer", data);

export const notifyCounterOffer = (userId, data) =>
  sendNotification(userId, "counter_offer_received", data);

export const notifyCounterAccepted = (userId, data) =>
  sendNotification(userId, "counter_offer_accepted", data);

export const notifyCounterRejected = (userId, data) =>
  sendNotification(userId, "counter_offer_rejected", data);

export const notifyWorkerAssigned = (userId, data) =>
  sendNotification(userId, "worker_assigned", data);
