import mongoose from "mongoose";
import Payment from "./Payment.model.js";
import PaymentMethod from "./paymentMethod.model.js";
import Booking from "../bookings/Booking.model.js";
import BookingAssignment from "../bookingAssignment/BookingAssignment.model.js";
import Wallet from "../wallet/Wallet.model.js";
import {
  notifyPaymentReceived,
  notifyPaymentPendingVerification,
  notifyEarningsPending,
} from "../notifications/Notification.service.js";
const PLATFORM_FEE_PERCENT = 0.1;

//  Payment Methods

export const addCardMethod = async (userId, cardData) => {
  const { cardholderName, cardNumber, expiryMonth, expiryYear, securityCode } =
    cardData;

  if (!cardNumber || cardNumber.replace(/\s/g, "").length !== 16)
    throw new Error("Invalid card number");
  if (!securityCode || !/^\d{3,4}$/.test(securityCode))
    throw new Error("Invalid security code");

  const cleanNumber = cardNumber.replace(/\s/g, "");
  const last4Digits = cleanNumber.slice(-4);
  const cardBrand =
    cleanNumber[0] === "4"
      ? "Visa"
      : cleanNumber[0] === "5"
        ? "Mastercard"
        : "Unknown";

  const existing = await PaymentMethod.findOne({
    owner: userId,
    ownerType: "user",
    type: "card",
    last4Digits,
    expiryMonth,
    expiryYear,
  });
  if (existing) throw new Error("This card is already added");

  const isFirstMethod = !(await PaymentMethod.findOne({
    owner: userId,
    ownerType: "user",
  }));

  return await PaymentMethod.create({
    owner: userId,
    ownerType: "user",
    type: "card",
    cardholderName,
    last4Digits,
    cardBrand,
    expiryMonth,
    expiryYear,
    cardToken: cleanNumber,
    isDefault: isFirstMethod,
  });
};

export const addInstapayMethod = async (
  userId,
  { instapayId, accountHolderName },
) => {
  if (!instapayId) throw new Error("InstaPay ID is required");

  const existing = await PaymentMethod.findOne({
    owner: userId,
    ownerType: "user",
    type: "instapay",
    instapayId,
  });
  if (existing) throw new Error("This InstaPay account is already added");

  const isFirstMethod = !(await PaymentMethod.findOne({
    owner: userId,
    ownerType: "user",
  }));

  return await PaymentMethod.create({
    owner: userId,
    ownerType: "user",
    type: "instapay",
    instapayId,
    accountHolderName,
    isDefault: isFirstMethod,
  });
};

export const getUserPaymentMethods = async (userId) => {
  return await PaymentMethod.find({
    owner: userId,
    ownerType: "user",
    isActive: true,
  }).sort({ isDefault: -1, createdAt: -1 });
};

export const deletePaymentMethod = async (userId, methodId) => {
  const method = await PaymentMethod.findOne({ _id: methodId, owner: userId });
  if (!method) throw new Error("Payment method not found");

  const wasDefault = method.isDefault;

  await PaymentMethod.findByIdAndDelete(methodId);

  if (wasDefault) {
    const next = await PaymentMethod.findOne({
      owner: userId,
      ownerType: "user",
      isActive: true,
      _id: { $ne: methodId },
    });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
};

//  Initiate Payment

export const initiatePayment = async (userId, bookingId, paymentMethod) => {
  const booking = await Booking.findById(bookingId)
    .populate("service", "name")
    .populate({
      path: "worker",
      populate: { path: "user", select: "firstName lastName" },
    });

  if (!booking) throw new Error("Booking not found");
  if (booking.user.toString() !== userId.toString())
    throw new Error("Unauthorized");
  if (booking.status !== "accepted")
    throw new Error("Booking must be accepted before payment");

  if (!booking.worker) {
    throw new Error("Worker not assigned to this booking");
  }

  const existingPayment = await Payment.findOne({ booking: bookingId });
  if (existingPayment && existingPayment.status === "paid")
    throw new Error("Booking already paid");

  const assignment = await BookingAssignment.findOne({
    booking: bookingId,
    status: { $in: ["accepted", "user_accepted"] },
    finalPrice: { $ne: null },
  }).sort({ updatedAt: -1 });

  const amount = assignment?.finalPrice ?? booking.totalAmount;
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT * 100) / 100;
  const workerEarnings = Math.round((amount - platformFee) * 100) / 100;

  const payment = await Payment.create({
    booking: bookingId,
    user: userId,
    worker: booking.worker._id,  
    amount,
    platformFee,
    workerEarnings,
    paymentMethod,
    status: paymentMethod === "instapay" ? "pending_verification" : "pending",
  });

  return {
    ...payment.toObject(),
    workerName: `${booking.worker.user?.firstName} ${booking.worker.user?.lastName}`,
    serviceName: booking.service?.name || "N/A",
    scheduledDate: booking.scheduledDate,
    instapayInstructions: paymentMethod === "instapay" ? {
      recipientName: "ServiGo",
      instapayId: "ServiGo@instapay",
      amount,
    } : null,
  };
};

//  Confirm Payment

export const confirmPayment = async (paymentId, userId) => {
  const payment = await Payment.findById(paymentId).populate({
    path: "booking",
    select: "status scheduledDate location totalAmount",
    populate: [{ path: "service", select: "name category" }],
  });

  if (!payment) throw new Error("Payment not found");
  if (payment.user.toString() !== userId.toString())
    throw new Error("Unauthorized");

  const serviceName = payment.booking.service.name;

  // === InstaPay ===
  if (payment.paymentMethod === "instapay") {
    if (!payment.aiVerificationResult?.rawResponse)
      throw new Error("Please upload your InstaPay receipt first");

    payment.status = "pending_verification";
    await payment.save();

    await notifyPaymentPendingVerification(
      payment.user,
      {
        paymentId: payment._id.toString(),
        bookingId: payment.booking._id.toString(),
      },
      { amount: payment.amount, serviceName }
    );

    return payment;
  }

  // === Card ===
  if (payment.paymentMethod === "card") {
    payment.status = "paid";
    await payment.save();

    await _releasePaymentToWorker(payment, serviceName);

    await notifyPaymentReceived(
      payment.user,
      {
        paymentId: payment._id.toString(),
        bookingId: payment.booking._id.toString(),
      },
      { amount: payment.amount, serviceName }
    );

    return payment;
  }

  // === Cash ===
  if (payment.paymentMethod === "cash") {
    payment.status = "paid";
    await payment.save();

    await _deductCashCommissionFromWorker(payment);

    await notifyPaymentReceived(
      payment.user,
      {
        paymentId: payment._id.toString(),
        bookingId: payment.booking._id.toString(),
      },
      { amount: payment.amount, serviceName }
    );

    return payment;
  }

  throw new Error("Invalid payment method");
};

//  Get Receipt

export const getReceipt = async (paymentId, userId) => {
  const payment = await Payment.findById(paymentId)
    .populate({
      path: "booking",
      populate: { path: "service", select: "name" },
    })
    .populate("user", "firstName lastName")
    .populate({
      path: "worker",
      populate: { path: "user", select: "firstName lastName" },
    });

  if (!payment) throw new Error("Payment not found");
  if (payment.user._id.toString() !== userId.toString())
    throw new Error("Unauthorized");
  if (payment.status === "pending_verification") {
    throw new Error("Please wait for admin approval.");
  }
  
  if (payment.status !== "paid") {
    throw new Error("Payment not completed yet. Current status: " + payment.status);
  }

  return {
    transactionId: payment.transactionId,
    service: payment.booking?.service?.name || "N/A",
    workerName: `${payment.worker?.user?.firstName} ${payment.worker?.user?.lastName}`,
    date: payment.updatedAt,
    senderName: `${payment.user.firstName} ${payment.user.lastName}`,
    paymentMethod: payment.paymentMethod,
    amount: payment.amount,
    adminFee: payment.platformFee,
  };
};

//  Helpers

export const getWorkerWalletByProfileId = async (workerProfileId) => {
  const workerProfile = await mongoose
    .model("WorkerProfile")
    .findById(workerProfileId)
    .select("user");

  if (!workerProfile) throw new Error("Worker profile not found");

  const wallet = await Wallet.findOne({ owner: workerProfile.user });
  if (!wallet) throw new Error("Worker wallet not found");

  return { wallet, workerUserId: workerProfile.user };
};

const _releasePaymentToWorker = async (payment, serviceName) => {
  const { wallet, workerUserId } = await getWorkerWalletByProfileId(payment.worker);

  await wallet.credit(payment.workerEarnings, {
    source: "booking_payment",
    referenceId: payment.booking,
    referenceModel: "Booking",
    note: `Earnings: ${payment.booking.toString().slice(-8)}`,
  });

  await notifyEarningsPending(
    workerUserId,
    {
      paymentId: payment._id.toString(),
      bookingId: payment.booking.toString(),
    },
    { amount: payment.workerEarnings, serviceName }
  );
};

const _deductCashCommissionFromWorker = async (payment) => {
  const { wallet } = await getWorkerWalletByProfileId(payment.worker);

  if (!wallet.hasSufficientBalance(payment.platformFee)) {
    throw new Error("Worker has insufficient balance for platform commission");
  }

  await wallet.debit(payment.platformFee, {
    source: "booking_commission",
    referenceId: payment.booking,
    referenceModel: "Booking",
    note: `Fee: ${payment.booking.toString().slice(-8)}`,
  });
};