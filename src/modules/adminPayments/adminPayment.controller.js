import Payment from "../payments/Payment.model.js";
import UserSubscription from "../subscriptions/UserSubscription.model.js";
import Category from "../categories/Category.model.js";
import mongoose from "mongoose";
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

//  ADMIN — Payment History with Search (by name, transactionId, service, category)
export const adminGetHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 5, from, to, search } = req.query;
    const matchFilter = { status: "paid" };
    
    // Date filter
    if (from || to) {
      matchFilter.createdAt = {};
      if (from) matchFilter.createdAt.$gte = new Date(from);
      if (to) matchFilter.createdAt.$lte = new Date(to);
    }
    
    // Get payments with population
    let query = Payment.find(matchFilter)
      .populate("user", "firstName lastName")
      .populate({ 
        path: "worker", 
        populate: { path: "user", select: "firstName lastName" } 
      })
      .populate({
        path: "booking",
        populate: {
          path: "service",
          select: "name category",
          populate: { path: "category", select: "name" }
        }
      });
    
    let payments = await query.lean();
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const isTransactionId = search.startsWith("TXN");
      
      if (isTransactionId) {
        payments = payments.filter(payment => payment.transactionId === search);
      } else {
        payments = payments.filter(payment => {
          const userName = `${payment.user?.firstName} ${payment.user?.lastName}`.toLowerCase();
          const workerName = `${payment.worker?.user?.firstName} ${payment.worker?.user?.lastName}`.toLowerCase();
          const serviceName = payment.booking?.service?.name?.toLowerCase() || "";
          const categoryName = payment.booking?.service?.category?.name?.toLowerCase() || "";
          
          return userName.includes(searchLower) || 
                 workerName.includes(searchLower) || 
                 serviceName.includes(searchLower) ||
                 categoryName.includes(searchLower);
        });
      }
    }
    
    // Pagination
    const total = payments.length;
    const skip = (page - 1) * limit;
    const paginatedPayments = payments.slice(skip, skip + limit);
    
    // Format response with service and category names
    const formattedHistory = paginatedPayments.map((payment) => ({
      id: payment.transactionId,
      user: { 
        name: `${payment.user?.firstName} ${payment.user?.lastName}`, 
        type: "client" 
      },
      worker: { 
        name: `${payment.worker?.user?.firstName} ${payment.worker?.user?.lastName}`, 
        type: "worker" 
      },
      service: payment.booking?.service?.name || null,
      category: payment.booking?.service?.category?.name || null,  
      date: payment.createdAt,
      amount: payment.amount,
      fee: payment.platformFee,
      netAmount: payment.workerEarnings,
      status: payment.status,
    }));
    
    return ApiResponse.success(res, {
      history: formattedHistory,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
};