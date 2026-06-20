import * as dashboardService from "./dashboard.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

// GET /api/admin/dashboard/overview
export const getOverview = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardOverview();
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

// GET /api/admin/dashboard/recent-bookings
export const getRecentBookings = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const bookings = await dashboardService.getRecentBookings(limit);
    return ApiResponse.success(res, bookings);
  } catch (error) { next(error); }
};
