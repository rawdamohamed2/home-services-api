import mongoose from "mongoose";

//  ADMIN — Dashboard Overview

export const getDashboardOverview = async () => {
  const User       = mongoose.model("User");
  const WorkerProfile = mongoose.model("WorkerProfile");
  const Booking     = mongoose.model("Booking");
  const Payment     = mongoose.model("Payment");
  const UserSubscription = mongoose.model("UserSubscription");

  const [
    clientsCount,
    workersCount,
    bookingStatusCounts,
    revenueResult,
    subscriptionRevenueResult,
  ] = await Promise.all([
    
    User.countDocuments({ role: "user" }),
   
    WorkerProfile.countDocuments(),

    Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$platformFee" } } },
    ]),

    UserSubscription.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]),
  ]);

  const bookingStats = {
    pending:     0,
    accepted:    0,
    "in-progress": 0,
    completed:   0,
    cancelled:   0,
    refunded:    0,
  };
  bookingStatusCounts.forEach((b) => {
    bookingStats[b._id] = b.count;
  });

  const bookingEarnings    = revenueResult[0]?.total            || 0;
  const subscriptionEarnings = subscriptionRevenueResult[0]?.total || 0;

  return {
    clients:  clientsCount,
    workers:  workersCount,
    bookings: {
      pending:    bookingStats.pending,
      inProgress: bookingStats["in-progress"],
      completed:  bookingStats.completed,
      cancelled:  bookingStats.cancelled,
      refunded:   bookingStats.refunded,
      total: Object.values(bookingStats).reduce((sum, n) => sum + n, 0),
    },
    revenue: {
      bookingEarnings,
      subscriptionEarnings,
      platformEarnings: bookingEarnings + subscriptionEarnings,
    },
  };
};

//  ADMIN — Recent Bookings (Client / Worker / Status)

export const getRecentBookings = async (limit = 5) => {
  const Booking = mongoose.model("Booking");

  const bookings = await Booking.find()
    .populate("user", "firstName lastName")
    .populate({
      path:     "worker",
      populate: { path: "user", select: "firstName lastName" },
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  return bookings.map((b) => ({
    _id:        b._id,
    clientName: b.user ? `${b.user.firstName} ${b.user.lastName}` : "N/A",
    workerName: b.worker?.user ? `${b.worker.user.firstName} ${b.worker.user.lastName}` : "Not assigned",
    status:     b.status,
    createdAt:  b.createdAt,
  }));
};
