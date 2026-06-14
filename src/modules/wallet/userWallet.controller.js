import Payment from "../payments/Payment.model.js";
import UserSubscription from "../Subscription Plans/UserSubscription.model.js";
import * as walletService from "./wallet.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

export const getMyWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);
    return ApiResponse.success(res, wallet);
  } catch (error) { next(error); }
};

export const getMyTransactions = async (req, res, next) => {
  try {
    
    const payments = await Payment.find({ user: req.user._id, status: "paid" })
      .populate({
        path: "booking",
        populate: {
          path: "service",
          select: "name category",
          populate: { path: "category", select: "name" }
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    const subscriptions = await UserSubscription.find({ user: req.user._id })
      .populate("plan", "name price discount finalPrice")
      .sort({ createdAt: -1 })
      .lean();

    const formattedPayments = payments.map(payment => ({
      type: "booking",
      serviceName: payment.booking?.service?.name || null,
      categoryName: payment.booking?.service?.category?.name || null,
      amount: payment.amount,
      fee: payment.platformFee,
      netAmount: payment.workerEarnings || payment.amount - payment.platformFee,
      date: payment.createdAt,
      status: payment.status,
      transactionId: payment.transactionId
    }));

    const formattedSubscriptions = subscriptions.map(sub => ({
      type: "subscription",
      planName: sub.plan?.name || null,
      amount: sub.amountPaid,
      originalPrice: sub.plan?.price,
      discount: sub.plan?.discount,
      startDate: sub.startDate,
      endDate: sub.endDate,
      date: sub.createdAt,
      status: sub.status,
      transactionId: sub.transactionId,
      paymentMethod: sub.paymentType,
      renewalCount: sub.renewalCount
    }));

    const allTransactions = [...formattedPayments, ...formattedSubscriptions]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return ApiResponse.success(res, allTransactions);
  } catch (error) { next(error); }
};