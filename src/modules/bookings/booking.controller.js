import errorHandler from "../../core/middleware/Errorhandler.js";
import {
  cancelBookingById,
  fetchBooking,
  fetchBookings,
  fetchBookingTimeline,
  getNearBookings,
  orderService,
  updateBooking,
  updateBookingStatus,
  markBookingComplete,
  fetchCompletedBookings,
} from "./booking.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

export const createBooking = async (req, res) => {
  try {
    const {
      service,
      selectedOptions = [],
      price,
      scheduledDate,
      duration,
      location,
      notes,
    } = req.body;

    const userId = req.user.id;

    const { booking, dispatch } = await orderService(
      service,
      selectedOptions,
      price,
      scheduledDate,
      duration,
      location,
      notes,
      userId,
    );

    ApiResponse.success(
      res,
      { booking, dispatch },
      "Booking created successfully",
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await fetchBooking(id);
    ApiResponse.success(res, bookings, "Booking fetched successfully");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const editBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { scheduledDate, duration, notes, location, selectedOptions } =
      req.body;
    const { newBooking, dispatch } = await updateBooking(
      userId,
      id,
      scheduledDate,
      duration,
      notes,
      location,
      selectedOptions,
    );
    console.log(newBooking);
    ApiResponse.success(
      res,
      { newBooking, dispatch },
      "Booking updated successfully",
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;
    const booking = await cancelBookingById(id, user, reason);
    ApiResponse.success(res, booking, "Booking canceled successfully");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const editBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const booking = await updateBookingStatus(id, status, note);
    ApiResponse.success(res, booking, `Booking status updated to '${status}'`);
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const getNearbyBookings = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 10000 } = req.query;
    const bookings = await getNearBookings(lng, lat, maxDistance);
    ApiResponse.success(res, { bookings, count: bookings.length });
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const getBookingTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await fetchBookingTimeline(id);
    ApiResponse.success(res, {
      timeline: booking.timeline,
      currentStatus: booking.status,
    });
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const getBookings = async (req, res) => {
  try {
    const data = req.query;
    const user = req.user;
    const { bookings, total, page, limit } = await fetchBookings(data, user);
    console.log(bookings);
    ApiResponse.sendPaginated(res, bookings, total, page, limit);
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const completeBooking = async (req, res) => {
  try {
    const booking = await markBookingComplete(
      req.params.bookingId,
      req.user._id,
    );
    return ApiResponse.success(res, booking, "Booking marked as completed");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    errorHandler(err, req, res);
  }
};

export const getCompletedBookings = async (req, res) => {
  try {
    const user = req.user;
    const bookings = await fetchCompletedBookings(user);
    return ApiResponse.success(res, bookings);
  } catch (err) {
    errorHandler(err, req, res);
  }
};
