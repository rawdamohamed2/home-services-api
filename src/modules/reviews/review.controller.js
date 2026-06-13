import * as reviewService from "./review.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

//  USER — Reviews / Comments

export const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    return ApiResponse.success(res, review, "Review submitted successfully", 201);
  } catch (error) { next(error); }
};

export const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, review, "Review updated successfully");
  } catch (error) { next(error); }
};

export const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.user._id, req.params.id);
    return ApiResponse.success(res, null, "Review deleted successfully");
  } catch (error) { next(error); }
};

//  Get Worker Reviews (Public)

export const getWorkerReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getWorkerReviews(req.params.workerId, req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

//  WORKER — My Profile Reviews / Hide

export const getMyProfileReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getMyProfileReviews(req.user._id, req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const hideComment = async (req, res, next) => {
  try {
    const review = await reviewService.toggleHideComment(req.user._id, req.params.id, true);
    return ApiResponse.success(res, review, "Comment hidden from your profile");
  } catch (error) { next(error); }
};

export const unhideComment = async (req, res, next) => {
  try {
    const review = await reviewService.toggleHideComment(req.user._id, req.params.id, false);
    return ApiResponse.success(res, review, "Comment unhidden");
  } catch (error) { next(error); }
};

//  Report Comment (User or Worker)

export const reportComment = async (req, res, next) => {
  try {
    const report = await reviewService.reportComment(req.user._id, req.body);
    return ApiResponse.success(res, report, "Report submitted successfully", 201);
  } catch (error) { next(error); }
};

//  ADMIN — Comment Reports

export const adminGetReports = async (req, res, next) => {
  try {
    const data = await reviewService.adminGetReports(req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const adminGetReportById = async (req, res, next) => {
  try {
    const report = await reviewService.adminGetReportById(req.params.id);
    return ApiResponse.success(res, report);
  } catch (error) { next(error); }
};

export const adminIgnoreReport = async (req, res, next) => {
  try {
    const report = await reviewService.adminIgnoreReport(req.params.id, req.user._id, req.body.notes);
    return ApiResponse.success(res, report, "Report ignored");
  } catch (error) { next(error); }
};

export const adminRemoveComment = async (req, res, next) => {
  try {
    const report = await reviewService.adminRemoveComment(req.params.id, req.user._id, req.body.notes);
    return ApiResponse.success(res, report, "Comment removed successfully");
  } catch (error) { next(error); }
};

export const adminMuteUser = async (req, res, next) => {
  try {
    const report = await reviewService.adminMuteUser(req.params.id, req.user._id, req.body.notes);
    return ApiResponse.success(res, report, "User muted for 7 days");
  } catch (error) { next(error); }
};
