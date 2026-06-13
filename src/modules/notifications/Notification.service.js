import mongoose from "mongoose";
import Notification from "./Notification.model.js";
import { emitToUser } from "../../socket/socket.js";
import { EVENTS } from "../../socket/socket.events.js";
import { sendFCM } from "../../core/firebase/fcm.js";

const MESSAGES = {
  // ── Booking ──────────────────────────────────────────────────────
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

  // ── Chat ─────────────────────────────────────────────────────────
  new_message: {
    title: (d) => d.senderName,
    body: (d) => d.messageText,
  },
  // ── Support Tickets ──────────────────────────────────────────────
  ticket_assigned: {
    title: "Ticket Assigned",
    body: (d) =>
      `Ticket #${d.ticketCode} (${d.subject}) has been assigned to you.`,
  },
  ticket_resolved: {
    title: "Ticket Resolved",
    body: (d) => `Your support ticket "${d.subject}" has been resolved.`,
  },
  ticket_closed: {
    title: "Ticket Closed",
    body: (d) => `Your support ticket "${d.subject}" has been closed.`,
  },

  // ═══════════════════════════════════════════════════════════════
  // ── Payments ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // المستخدم دفع بنجاح (card/instapay confirmed)
  payment_received: {
    title: "Payment Successful",
    body: (d) =>
      `Your payment of ${d.amount} L.E for ${d.serviceName} was successful.`,
  },

  // المستخدم رفع proof صورة وفي انتظار مراجعة الأدمن
  payment_pending_verification: {
    title: "Payment Under Review",
    body: (d) =>
      `Your payment of ${d.amount} L.E for ${d.serviceName} is being verified. We'll notify you once approved.`,
  },

  // الدفع فشل (card declined, AI verification failed, etc.)
  payment_failed: {
    title: "Payment Failed",
    body: (d) =>
      `Your payment of ${d.amount} L.E for ${d.serviceName} failed. Please try again.`,
  },

  // تم رد المبلغ
  payment_refunded: {
    title: "Payment Refunded",
    body: (d) =>
      `${d.amount} L.E has been refunded to you for ${d.serviceName}.${d.reason ? ` Reason: ${d.reason}` : ""}`,
  },

  // ── Earnings (Worker side) ─────────────────────────────────────────

  // العامل خلص شغلانة — الفلوس وقعت pending في محفظته
  earnings_pending: {
    title: "Earnings Pending",
    body: (d) =>
      `You earned ${d.amount} L.E from ${d.serviceName}. It will be available after admin approval.`,
  },

  // الأدمن وافق على الدفعة — الفلوس بقت في الـ balance
  earnings_released: {
    title: "Earnings Released",
    body: (d) =>
      `${d.amount} L.E from ${d.serviceName} has been added to your wallet balance.`,
  },

  // ── Wallet ───────────────────────────────────────────────────────
  wallet_credited: {
    title: "Wallet Credited",
    body: (d) => `${d.amount} L.E added to your wallet.`,
  },
  wallet_debited: {
    title: "Wallet Debited",
    body: (d) => `${d.amount} L.E deducted from your wallet.`,
  },

  // ── Withdrawals (Worker side) ───────────────────────────────────────

  withdrawal_requested: {
    title: "Withdrawal Requested",
    body: (d) =>
      `Your withdrawal request of ${d.amount} L.E has been submitted and is pending approval.`,
  },
  withdrawal_approved: {
    title: "Withdrawal Approved",
    body: (d) =>
      `Your withdrawal of ${d.amount} L.E has been approved and is being processed.`,
  },
  withdrawal_rejected: {
    title: "Withdrawal Rejected",
    body: (d) =>
      `Your withdrawal request of ${d.amount} L.E was rejected.${d.reason ? ` Reason: ${d.reason}` : ""}`,
  },
  withdrawal_paid: {
    title: "Withdrawal Paid",
    body: (d) =>
      `${d.amount} L.E has been transferred to your ${d.method === "instapay" ? "InstaPay" : "card"} account.`,
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
  new_message: EVENTS.NEW_MESSAGE,
  ticket_assigned: EVENTS.NOTIFICATION,
  ticket_resolved: EVENTS.NOTIFICATION,
  ticket_closed: EVENTS.NOTIFICATION,

  // ── Payments ──────────────────────────────────────────────────
  payment_received: EVENTS.PAYMENT_RECEIVED,
  payment_pending_verification: EVENTS.PAYMENT_PENDING,
  payment_failed: EVENTS.PAYMENT_FAILED,
  payment_refunded: EVENTS.PAYMENT_REFUNDED,
  earnings_pending: EVENTS.EARNINGS_PENDING,
  earnings_released: EVENTS.EARNINGS_RELEASED,
  wallet_credited: EVENTS.NOTIFICATION,
  wallet_debited: EVENTS.NOTIFICATION,
  withdrawal_requested: EVENTS.WITHDRAWAL_REQUESTED,
  withdrawal_approved: EVENTS.WITHDRAWAL_APPROVED,
  withdrawal_rejected: EVENTS.WITHDRAWAL_REJECTED,
  withdrawal_paid: EVENTS.WITHDRAWAL_PAID,
};

export const sendNotification = async (
  userId,
  type,
  data = {},
  messageData = {},
) => {
  try {
    console.log("_________________________________________");
    const template = MESSAGES[type];
    if (!template) {
      console.warn("[Notification] Unknown type:", type);
      return null;
    }

    const title =
      typeof template.title === "function"
        ? template.title(messageData)
        : template.title;

    const body = template.body(messageData);
    console.log(body);
    const notification = await Notification.create({
      user: userId,
      title,
      type,
      message: body,
      metadata: data,
    });
    console.log(notification);
    // 2. بعت socket real-time
    const socketEvent = SOCKET_EVENT_MAP[type] || EVENTS.NOTIFICATION;

    emitToUser(userId, socketEvent, {
      notification: {
        _id: notification._id,
        title,
        body,
        type,
        metadata: data,
        createdAt: notification.createdAt,
      },
      ...data,
    });

    // 3. بعت FCM لو الـ user offline
    const User = mongoose.model("User");
    const user = await User.findById(userId).select("fcmToken").lean();

    if (user?.fcmToken) {
      const fcmResult = await sendFCM(user.fcmToken, {
        title,
        body,
        data: {
          type,
          notificationId: notification._id.toString(),
          ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          ),
        },
      });

      if (fcmResult?.invalidToken) {
        await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
      }
    }

    return notification;
  } catch (error) {
    console.log(error.message);
    return error.message;
  }
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

export const notifyNewMessage = (u, d, m) =>
  sendNotification(u, "new_message", d, m);

export const notifyTicketAssigned = (u, d, m) =>
  sendNotification(u, "ticket_assigned", d, m);
export const notifyTicketResolved = (u, d, m) =>
  sendNotification(u, "ticket_resolved", d, m);
export const notifyTicketClosed = (u, d, m) =>
  sendNotification(u, "ticket_closed", d, m);

// User: payment تم بنجاح
export const notifyPaymentReceived = (u, d, m) =>
  sendNotification(u, "payment_received", d, m);

// User: payment proof تحت المراجعة
export const notifyPaymentPendingVerification = (u, d, m) =>
  sendNotification(u, "payment_pending_verification", d, m);

// User: payment فشل
export const notifyPaymentFailed = (u, d, m) =>
  sendNotification(u, "payment_failed", d, m);

// User: payment تم رده
export const notifyPaymentRefunded = (u, d, m) =>
  sendNotification(u, "payment_refunded", d, m);

// Worker: فلوس pending بعد إكمال البوكينج
export const notifyEarningsPending = (u, d, m) =>
  sendNotification(u, "earnings_pending", d, m);

// Worker: الأدمن وافق على الدفعة → الفلوس بقت available
export const notifyEarningsReleased = (u, d, m) =>
  sendNotification(u, "earnings_released", d, m);

// Wallet
export const notifyWalletCredited = (u, d, m) =>
  sendNotification(u, "wallet_credited", d, m);
export const notifyWalletDebited = (u, d, m) =>
  sendNotification(u, "wallet_debited", d, m);

// ── Withdrawals (Worker side) ───────────────────────────────────────
export const notifyWithdrawalRequested = (u, d, m) =>
  sendNotification(u, "withdrawal_requested", d, m);
export const notifyWithdrawalApproved = (u, d, m) =>
  sendNotification(u, "withdrawal_approved", d, m);
export const notifyWithdrawalRejected = (u, d, m) =>
  sendNotification(u, "withdrawal_rejected", d, m);
export const notifyWithdrawalPaid = (u, d, m) =>
  sendNotification(u, "withdrawal_paid", d, m);
