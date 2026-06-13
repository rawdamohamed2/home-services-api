import Payment from "../payments/Payment.model.js";
import Booking from "../bookings/Booking.model.js";
import { verifyReceiptWithAI } from "./aiDetection.service.js";
import { uploadReceiptToCloudinary } from "../../core/services/cloudinary.service.js";
import { getWorkerWalletByProfileId } from "../payments/payment.service.js";
import {
  notifyEarningsReleased,
  notifyPaymentFailed,
  notifyPaymentReceived,
} from "../notifications/Notification.service.js";

//  User — Verify Receipt (AI)

export const verifyInstapayReceipt = async (
  paymentId,
  imageBuffer,
  mimetype,
  originalname,
) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error("Payment not found");
  if (payment.paymentMethod !== "instapay")
    throw new Error("This payment is not instapay");
  if (payment.status !== "pending_verification")
    throw new Error("Payment is not awaiting verification");

  const imageUrl = await uploadReceiptToCloudinary(imageBuffer, paymentId);
  payment.paymentProofImage = imageUrl;

  const aiResult = await verifyReceiptWithAI(
    imageBuffer,
    mimetype,
    originalname,
  );

  payment.aiVerificationResult = {
    isValid: aiResult.isValid,
    keywordsFound: aiResult.keywordsFound,
    extractedText: aiResult.extractedText,
    detectedAmount: aiResult.detectedAmount,
    rawResponse: aiResult.rawResponse,
  };

  await payment.save();

  return {
    isValid: aiResult.isValid,
    keywordsFound: aiResult.keywordsFound,
    detectedAmount: aiResult.detectedAmount,
    paymentId: payment._id,
    canConfirm: true,
  };
};

//  Admin — InstaPay Payments

export const getAdminInstapayPayments = async (query = {}) => {
  const { page = 1, limit = 10, status = "pending_verification" } = query;

  const [payments, total] = await Promise.all([
    Payment.find({ paymentMethod: "instapay", status })
      .populate("user", "firstName lastName")
      .populate({
        path: "worker",
        populate: { path: "user", select: "firstName lastName" },
      })
      .populate({
        path: "booking",
        populate: { path: "service", select: "name" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Payment.countDocuments({ paymentMethod: "instapay", status }),
  ]);

  return {
    payments: payments.map((p) => ({
      _id: p._id,
      transactionId: p.transactionId,
      user: `${p.user?.firstName} ${p.user?.lastName}`,
      worker: `${p.worker?.user?.firstName} ${p.worker?.user?.lastName}`,
      service: p.booking?.service?.name || "N/A",
      amount: p.amount,
      status: p.status,
      receiptImage: p.paymentProofImage,
      aiResult: {
        isValid: p.aiVerificationResult?.isValid,
        detectedAmount: p.aiVerificationResult?.detectedAmount,
        keywordsFound: p.aiVerificationResult?.keywordsFound,
      },
      createdAt: p.createdAt,
    })),
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  };
};

export const adminApproveInstapayPayment = async (paymentId, adminId) => {
  try {
    const payment = await Payment.findById(paymentId).populate({
      path: "booking",
      populate: { path: "service", select: "name" },
    });
    if (!payment) throw new Error("Payment not found");
    if (payment.paymentMethod !== "instapay")
      throw new Error("Not an instapay payment");
    if (payment.status !== "pending_verification")
      throw new Error("Payment is not pending verification");

    payment.status = "paid";
    payment.approvedByAdmin = true;
    payment.approvedAt = new Date();
    payment.approvedBy = adminId;
    payment.releasedToWorker = true;
    payment.releasedAt = new Date();
    await payment.save();

    await Booking.findByIdAndUpdate(payment.booking, { status: "in-progress" });

    const { wallet, workerUserId } = await getWorkerWalletByProfileId(
      payment.worker,
    );

    await wallet.credit(payment.workerEarnings, {
      source: "booking_payment",
      referenceId: payment.booking,
      referenceModel: "Booking",
      note: `Earnings from booking #${payment.booking}`,
    });

    const serviceName = payment.booking.service?.name || "your service";

    await notifyPaymentReceived(
      payment.user,
      {
        paymentId: payment._id.toString(),
        bookingId: payment.booking._id.toString(),
      },
      { amount: payment.amount, serviceName },
    );

    await notifyEarningsReleased(
      workerUserId,
      {
        paymentId: payment._id.toString(),
        bookingId: payment.booking._id.toString(),
      },
      { amount: payment.workerEarnings, serviceName },
    );

    return payment;
  } catch (error) {
    throw error;
  }
};

export const adminRejectInstapayPayment = async (
  paymentId,
  adminId,
  reason,
) => {
  const payment = await Payment.findById(paymentId).populate({
    path: "booking",
    populate: { path: "service", select: "name" },
  });

  if (!payment) throw new Error("Payment not found");
  if (payment.paymentMethod !== "instapay")
    throw new Error("Not an instapay payment");
  if (payment.status !== "pending_verification")
    throw new Error("Payment is not pending verification");

  payment.status = "failed";
  payment.approvedByAdmin = false;
  payment.approvedAt = new Date();
  payment.approvedBy = adminId;
  payment.refundReason = reason || "Rejected by admin";
  await payment.save();

  await notifyPaymentFailed(
    payment.user,
    {
      paymentId: payment._id.toString(),
      bookingId: payment.booking._id.toString(),
    },
    {
      amount: payment.amount,
      serviceName: payment.booking.service?.name || "your service",
    },
  );

  return payment;
};
