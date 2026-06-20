import Payment from "../payments/Payment.model.js";
import UserSubscription from "../SubscriptionPlans/UserSubscription.model.js";

export const getPaymentHistory = async (userId) => {
  
  const payments = await Payment.find({ user: userId, status: "paid" })
    .populate({
      path: "booking",
      populate: {
        path: "service",
        select: "name category",
        populate: { path: "category", select: "name" },
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  
  const subscriptions = await UserSubscription.find({ user: userId })
    .populate("plan", "name price discount finalPrice")
    .sort({ createdAt: -1 })
    .lean();

  
  const formattedPayments = payments.map((payment) => ({
    type: "booking",
    serviceName: payment.booking?.service?.name || null,
    categoryName: payment.booking?.service?.category?.name || null,
    amount: payment.amount,
    fee: payment.platformFee,
    netAmount: payment.workerEarnings || payment.amount - payment.platformFee,
    date: payment.createdAt,
    paymentStatus: payment.status,           
    bookingStatus: payment.booking?.status || null,  
    transactionId: payment.transactionId,
  }));

  const formattedSubscriptions = subscriptions.map((sub) => ({
    type: "subscription",
    planName: sub.plan?.name || null,
    amount: sub.amountPaid,
    originalPrice: sub.plan?.price,
    discount: sub.plan?.discount,
    startDate: sub.startDate,
    endDate: sub.endDate,
    date: sub.createdAt,
    subscriptionStatus: sub.status,           
    paymentStatus: "paid",                    
    transactionId: sub.transactionId,
    paymentMethod: sub.paymentType,
    renewalCount: sub.renewalCount,
  }));

  const allTransactions = [...formattedPayments, ...formattedSubscriptions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return allTransactions;
};