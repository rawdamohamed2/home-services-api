import mongoose from "mongoose";
import Review from "./Review.model.js";
import CommentReport from "./CommentReport.model.js";
import WorkerProfile from "../workers/WorkerProfile.model.js";
import User from "../users/user.model.js";

//  Helpers

// Check that the user is not muted before you do anything  comment/review/report
const checkNotMuted = async (userId) => {
  const user = await User.findById(userId).select("isMuted mutedUntil");
  if (!user) throw new Error("User not found");

  if (user.isMuted && user.mutedUntil) {
    if (user.mutedUntil > new Date()) {
      const remainingDays = Math.ceil(
        (user.mutedUntil - new Date()) / (1000 * 60 * 60 * 24)
      );
      throw new Error(
        `You are muted and cannot post comments for ${remainingDays} more day(s)`
      );
    } else {

      user.isMuted = false;
      user.mutedUntil = null;
      await user.save();
    }
  }
};

//  USER — Reviews / Comments

export const createReview = async (userId, { workerId, bookingId, rating, comment }) => {
  await checkNotMuted(userId);

  const worker = await WorkerProfile.findById(workerId);
  if (!worker) throw new Error("Worker not found");

  return await Review.create({
    user: userId,
    worker: workerId,
    booking: bookingId || null,
    rating,
    comment: comment || null,
  });
};

export const updateReview = async (userId, reviewId, { rating, comment }) => {
  await checkNotMuted(userId);

  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) throw new Error("Review not found");
  if (review.isRemovedByAdmin) throw new Error("This comment was removed by admin and cannot be edited");

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  review.editedAt = new Date();

  await review.save();
  return review;
};

export const deleteReview = async (userId, reviewId) => {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) throw new Error("Review not found");

  await review.deleteOne();
};

//  Get Reviews for a Worker (Public)

export const getWorkerReviews = async (workerId, query = {}) => {
  const { page = 1, limit = 10 } = query;

  const workerExists = await WorkerProfile.findById(workerId);
  if (!workerExists) {
    throw new Error("Worker not found");
  }

  const filter = {
    worker: workerId,
    isRemovedByAdmin: false,
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  const { ratingAverage, totalRatings } = await Review.calculateAverageRating(workerId);

  return {
    ratingAverage,
    totalRatings,
    reviews,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  };
};

//  WORKER — Hide / Unhide Comment (on their own profile only)

export const getMyProfileReviews = async (workerUserId, query = {}) => {
  // workerUserId = User._id بتاع الـ worker
  const workerProfile = await WorkerProfile.findOne({ user: workerUserId });
  if (!workerProfile) throw new Error("Worker profile not found");

  const { page = 1, limit = 10, includeHidden = "true" } = query;

  const filter = {
    worker: workerProfile._id,
    isRemovedByAdmin: false,
  };

  // includeHidden=false 
  if (includeHidden === "false") filter.isHiddenByWorker = false;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  const { ratingAverage, totalRatings } = await Review.calculateAverageRating(workerProfile._id);

  return {
    ratingAverage,
    totalRatings,
    reviews,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  };
};

export const toggleHideComment = async (workerUserId, reviewId, hide) => {
  const workerProfile = await WorkerProfile.findOne({ user: workerUserId });
  if (!workerProfile) throw new Error("Worker profile not found");

  const review = await Review.findOne({ _id: reviewId, worker: workerProfile._id });
  if (!review) throw new Error("Review not found");

  review.isHiddenByWorker = hide;
  await review.save();

  return review;
};

//  Report Comment (User or Worker)

const REASON_MAP = {
  spam_or_misleading: "Spam or misleading",
  offensive_or_abusive: "Offensive or abusive language",
  fake_review: "Fake review",
  other: "Other",
};

export const reportComment = async (reporterId, { reviewId, reason, otherReason }) => {
  await checkNotMuted(reporterId);

  const review = await Review.findById(reviewId).populate("user", "_id");
  if (!review) throw new Error("Review not found");

  if (review.user._id.toString() === reporterId.toString())
    throw new Error("You cannot report your own comment");

  let finalReason = reason;
  let finalOtherReason = null;

  if (otherReason && !reason) {
    finalReason = "other";
    finalOtherReason = otherReason.trim();
  } else if (reason && !otherReason) {
    finalReason = reason;
  } else {
    throw new Error("Please provide either a reason or specify in 'Other'");
  }

  if (finalReason === "other" && (!finalOtherReason || finalOtherReason.length < 3)) {
    throw new Error("Please provide a valid reason in 'Other'");
  }

  return await CommentReport.create({
    review: reviewId,
    reportedBy: reporterId,
    commentAuthor: review.user._id,
    reason: finalReason,
    otherReason: finalOtherReason,
  });
};

//  ADMIN — Comment Reports

export const adminGetReports = async (query = {}) => {
  const { page = 1, limit = 10, status = "pending", search } = query;
  const filter = {};

  if (status) filter.status = status;

  let reportQuery = CommentReport.find(filter)
    .populate({
      path: "review",
      select: "comment user worker",
      populate: { path: "user", select: "firstName lastName" },
    })
    .populate("reportedBy", "firstName lastName")
    .populate("commentAuthor", "firstName lastName")
    .sort({ createdAt: -1 });

  if (search) {
    const allReports = await CommentReport.find(filter)
      .populate("reportedBy", "firstName lastName")
      .populate("commentAuthor", "firstName lastName");

    const filtered = allReports.filter((r) => {
      const idMatch = r._id.toString().includes(search);
      const authorName = `${r.commentAuthor?.firstName} ${r.commentAuthor?.lastName}`.toLowerCase();
      const reporterName = `${r.reportedBy?.firstName} ${r.reportedBy?.lastName}`.toLowerCase();
      return (
        idMatch ||
        authorName.includes(search.toLowerCase()) ||
        reporterName.includes(search.toLowerCase())
      );
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + Number(limit));

    return {
      reports: paged.map(formatReportSummary),
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    };
  }

  const [reports, total] = await Promise.all([
    reportQuery.skip((page - 1) * limit).limit(Number(limit)),
    CommentReport.countDocuments(filter),
  ]);

  return {
    reports: reports.map(formatReportSummary),
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  };
};

const formatReportSummary = (r) => ({
  _id: r._id,
  reason: REASON_MAP[r.reason],
  reasonKey: r.reason,
  originalComment: r.review?.comment || "[Comment deleted]",
  author: r.commentAuthor ? `${r.commentAuthor.firstName} ${r.commentAuthor.lastName}` : "Unknown",
  reportedBy: r.reportedBy ? `${r.reportedBy.firstName} ${r.reportedBy.lastName}` : "Unknown",
  submittedAt: r.createdAt,
  status: r.status,
});

export const adminGetReportById = async (reportId) => {
  const report = await CommentReport.findById(reportId)
    .populate({
      path: "review",
      select: "comment user worker rating",
      populate: { path: "user", select: "firstName lastName" },
    })
    .populate("reportedBy", "firstName lastName")
    .populate("commentAuthor", "firstName lastName");

  if (!report) throw new Error("Report not found");

  return {
    _id: report._id,
    reason: REASON_MAP[report.reason],
    reasonKey: report.reason,
    otherReason: report.otherReason,
    originalComment: report.review?.comment || "[Comment deleted]",
    commentRating: report.review?.rating,
    commentAuthor: report.commentAuthor
      ? `${report.commentAuthor.firstName} ${report.commentAuthor.lastName}`
      : "Unknown",
    commentAuthorId: report.commentAuthor?._id,
    reportedBy: report.reportedBy
      ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}`
      : "Unknown",
    submittedAt: report.createdAt,
    status: report.status,
    adminNotes: report.adminNotes,
    reviewId: report.review?._id,
  };
};

//  Ignore Report 
export const adminIgnoreReport = async (reportId, adminId, notes) => {
  const report = await CommentReport.findById(reportId);
  if (!report) throw new Error("Report not found");
  if (report.status !== "pending") throw new Error("Report already reviewed");

  report.status = "ignored";
  report.adminNotes = notes || null;
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  await report.save();

  return report;
};

//  Remove Comment 
export const adminRemoveComment = async (reportId, adminId, notes) => {
  const report = await CommentReport.findById(reportId);
  if (!report) throw new Error("Report not found");
  if (report.status !== "pending") throw new Error("Report already reviewed");

  const review = await Review.findById(report.review);
  if (!review) throw new Error("Review not found");

  review.isRemovedByAdmin = true;
  review.removalReason = report.reason;
  await review.save();

  report.status = "comment_removed";
  report.adminNotes = notes || null;
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  await report.save();

  return report;
};

//  Mute User 7 Days 
export const adminMuteUser = async (reportId, adminId, notes) => {
  const report = await CommentReport.findById(reportId);
  if (!report) throw new Error("Report not found");
  if (report.status !== "pending") throw new Error("Report already reviewed");

  const mutedUntil = new Date();
  mutedUntil.setDate(mutedUntil.getDate() + 7);

  await User.findByIdAndUpdate(report.commentAuthor, {
    isMuted: true,
    mutedUntil,
  });

  report.status = "user_muted";
  report.adminNotes = notes || null;
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  await report.save();

  return report;
};
