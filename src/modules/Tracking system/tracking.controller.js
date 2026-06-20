import * as trackingService from "./tracking.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import errorHandler from "../../core/middleware/Errorhandler.js";

export const updateLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    const userId = req.user._id;
    const result = await trackingService.updateWorkerLocation(userId, {
      longitude: Number(longitude),
      latitude: Number(latitude),
    });
    return ApiResponse.success(res, result, "Location updated");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const getWorkerLocation = async (req, res) => {
  try {
    const { workerId } = req.params;
    const location = await trackingService.getWorkerLocation(
      req.user._id,
      workerId,
    );
    return ApiResponse.success(res, location, "Worker location fetched");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const profile = await trackingService.updateAvailabilityStatus(
      req.user._id,
      req.body.status,
    );
    return ApiResponse.success(res, profile, "Status updated");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const disableLocation = async (req, res) => {
  try {
    const result = await trackingService.disableWorkerLocation(req.user._id);
    return ApiResponse.success(res, result, "Location disabled");
  } catch (err) {
    if (err.isOperational) errorHandler(err, req, res);
  }
};
