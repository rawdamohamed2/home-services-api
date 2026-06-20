import ApiResponse from "../../core/utils/ApiResponse.js";
import { sendEmail } from "../../core/utils/sendEmail.js";
import {
  fetchAllWorkers,
  fetchWorkerById,
  updateWorkerFullProfile,
  getPendingAssignments,
  getWorkerReviews,
  markBookingComplete,
  updateGeoLocation,
  updateWorkerAvailability,
  updateAvailabilityStatus,
  deleteWorker,
  editWorkerData,
  viewWorkerProfile,
  getWorkerDashboardData,
  getFullWorkerProfile,
} from "./worker.service.js";
import errorHandler from "../../core/middleware/Errorhandler.js";

export const updateWorkerProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const updatedProfile = await updateWorkerFullProfile(userId, req.body);

    return ApiResponse.success(
      res,
      updatedProfile,
      "Profile updated successfully",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const userId = req.user._id;
    const workerProfile = await updateWorkerAvailability(userId, availability);
    return ApiResponse.success(
      res,
      workerProfile,
      "Availability updated successfully",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const getMe = async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    return ApiResponse.error(res, "User id not found");
  }
  try {
    const data = await getFullWorkerProfile(userId);
    return ApiResponse.success(res, data, "Your profile fetched successfully");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const updatedProfile = await updateGeoLocation(req.user._id, lat, lng);

    return ApiResponse.success(
      res,
      updatedProfile,
      "Location updated successfully",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateAvailabilityStatus(req.user._id, status);

    return ApiResponse.success(
      res,
      updated,
      `You are now ${updated.availabilityStatus}`,
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const getMyAssignments = async (req, res) => {
  try {
    const assignments = await getPendingAssignments(req.user._id);
    return ApiResponse.success(res, assignments, "Pending assignments fetched");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const bookings = await markBookingComplete(id, userId);
    return ApiResponse.success(res, bookings, "Worker bookings fetched");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// export const getMyBookings = async (req, res) => {
//     try {
//         const { status } = req.query;
//         const bookings = await getWorkerBookings(req.user._id, status);
//         return ApiResponse.success(res, bookings, 'Worker bookings fetched');
//     } catch (error) {
//         errorHandler(error, req, res);
//     }
// };

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await getWorkerReviews(req.user._id);
    return ApiResponse.success(res, reviews, "Reviews fetched successfully");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const deleteMe = async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    return ApiResponse.error(res, "User id not found");
  }
  try {
    const data = await deleteWorker(userId);
    await sendEmail(
      data.email,
      "Your profile is deleted",
      "Your profile deleted successfully." +
        "if you didn't make this change, please contact support immediately.",
    );
    return ApiResponse.success(
      res,
      data,
      "the worker profile was deleted successfully.",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

//_________________________________________
export const getWorkerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const dashboardData = await getWorkerDashboardData(userId);

    const finalResponse = {
      workerInfo: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profileImage: req.user.profileImage,
      },
      ...dashboardData,
    };

    return ApiResponse.success(
      res,
      finalResponse,
      "Dashboard data fetched successfully",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

//_________________________________________
export const getAllWorkers = async (req, res) => {
  try {
    const data = req.query;
    const result = await fetchAllWorkers(data);

    return ApiResponse.success(
      res,
      {
        workers: result.workers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: Math.ceil(result.total / result.limit),
        },
      },
      "Workers fetched successfully",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    const workerProfile = await fetchWorkerById(id);

    return ApiResponse.success(
      res,
      workerProfile,
      "Worker profile fetched successfully",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const updateWorker = async (req, res) => {
  try {
    const { clientInfo, workerInfo } = req.body;
    const { workerId } = req.params;
    const worker = await editWorkerData(workerId, clientInfo, workerInfo);
    return ApiResponse.success(res, worker, "worker updated successfully");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const viewWorker = async (req, res) => {
  try {
    const userId = req.user._id;
    const { workerId } = req.params;
    const { bookingId } = req.body;
    const worker = await viewWorkerProfile(userId, workerId, bookingId);
    return ApiResponse.success(res, worker);
  } catch (e) {
    errorHandler(e, req, res);
  }
};
