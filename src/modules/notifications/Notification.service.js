import mongoose from "mongoose";
import Notification from "./Notification.model.js";
import { emitToUser } from "../../socket/socket.js";
import { EVENTS } from "../../socket/socket.events.js";
import { sendFCM } from "../../core/firebase/fcm.js";

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
  booking_offer_updated: {
    title: "Booking Updated",
    body: (d) =>
      `The details for your ${d.serviceName} request have been updated.`,
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
  booking_offer_updated: EVENTS.BOOKING_UPDATED,
  worker_assigned: EVENTS.WORKER_ASSIGNED,
};

export const sendNotification = async (
  userId,
  type,
  data = {},
  messageData = {},
) => {
  const template = MESSAGES[type];
  if (!template) {
    console.warn("[Notification] Unknown type:", type);
    return null;
  }

  const notification = await Notification.create({
    user: userId,
    title: template.title,
    type: type || "system",
    message: template.body(messageData),
    metadata: data,
  });

  const payload = {
    notification: {
      _id: notification._id,
      title: notification.title,
      body: notification.message,
      type: notification.type,
      metadata: data,
      createdAt: notification.createdAt,
    },
    ...data,
  };

  const socketEvent = SOCKET_EVENT_MAP[type] || EVENTS.NOTIFICATION;
  emitToUser(userId, socketEvent, payload);

  const User = mongoose.model("User");
  const user = await User.findById(userId).select("fcmToken").lean();

  if (user?.fcmToken) {
    const fcmResult = await sendFCM(user.fcmToken, {
      title: template.title,
      body: template.body(messageData),
      data: { type, notificationId: notification._id.toString(), ...data },
    });

    if (fcmResult?.invalidToken) {
      await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
    }
  }

  return notification;
};

export const notifyBookingCreated = (u, d, m) =>
  sendNotification(u, "booking_created", d, m);
export const notifyBookingAccepted = (u, d, m) =>
  sendNotification(u, "booking_accepted", d, m);
export const notifyBookingCancelled = (u, d, m) =>
  sendNotification(u, "booking_cancelled", d, m);
export const notifyBookingCompleted = (u, d, m) =>
  sendNotification(u, "booking_completed", d, m);
export const notifyNewOffer = (u, d, m) =>
  sendNotification(u, "new_booking_offer", d, m);
export const notifyCounterOffer = (u, d, m) =>
  sendNotification(u, "counter_offer_received", d, m);
export const notifyCounterAccepted = (u, d, m) =>
  sendNotification(u, "counter_offer_accepted", d, m);
export const notifyCounterRejected = (u, d, m) =>
  sendNotification(u, "counter_offer_rejected", d, m);
export const notifyWorkerAssigned = (u, d, m) =>
  sendNotification(u, "worker_assigned", d, m);
export const notifyBookingUpdated = (u, d, m) =>
  sendNotification(u, "booking_offer_updated", d, m);
