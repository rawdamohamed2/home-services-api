import Payment from "../payments/Payment.model.js";
import UserSubscription from "../subscriptions/UserSubscription.model.js";  // ✅ أضيفي
import ApiResponse from "../../core/utils/ApiResponse.js";

//  ADMIN — Revenue Report
export const adminGetRevenue = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const matchFilter = {
      status: "paid",
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    };

    const [bookingResult] = await Payment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          clientPayments:   { $sum: "$amount" },
          workerEarnings:   { $sum: "$workerEarnings" },
          platformEarnings: { $sum: "$platformFee" },
        },
      },
    ]);

    const subscriptionFilter = {};
    if (from) subscriptionFilter.createdAt = { $gte: new Date(from) };
    if (to) subscriptionFilter.createdAt = { ...subscriptionFilter.createdAt, $lte: new Date(to) };

    const [subscriptionResult] = await UserSubscription.aggregate([
      { $match: subscriptionFilter },
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: "$amountPaid" },
          subscriptionCount: { $sum: 1 },
        },
      },
    ]);

    const [pendingResult] = await Payment.aggregate([
      { $match: { status: "pending_verification" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return ApiResponse.success(res, {
      clientPayments:   bookingResult?.clientPayments   || 0,
      workerEarnings:   bookingResult?.workerEarnings   || 0,
      platformEarnings: bookingResult?.platformEarnings || 0,
      subscriptionRevenue: subscriptionResult?.totalSubscriptions || 0,
      subscriptionCount:   subscriptionResult?.subscriptionCount || 0,
      totalPlatformRevenue: (bookingResult?.platformEarnings || 0) + (subscriptionResult?.totalSubscriptions || 0),
      
      pending: pendingResult?.total || 0,
    });
  } catch (error) { next(error); }
};

//  ADMIN — Payment History

export const adminGetHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 5, from, to } = req.query;

    const matchFilter = { status: "paid" };
    if (from || to) {
      matchFilter.createdAt = {};
      if (from) matchFilter.createdAt.$gte = new Date(from);
      if (to)   matchFilter.createdAt.$lte = new Date(to);
    }

    const [payments, total] = await Promise.all([
      Payment.find(matchFilter)
        .populate("user", "firstName lastName")
        .populate({ path: "worker", populate: { path: "user", select: "firstName lastName" } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Payment.countDocuments(matchFilter),
    ]);

    return ApiResponse.success(res, {
      history: payments.map((p) => ({
        id:     p.transactionId,
        user:   { name: `${p.user?.firstName} ${p.user?.lastName}`,                type: "client" },
        worker: { name: `${p.worker?.user?.firstName} ${p.worker?.user?.lastName}`, type: "worker" },
        date:   p.createdAt,
        amount: p.amount,
        status: p.status,
      })),
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
};