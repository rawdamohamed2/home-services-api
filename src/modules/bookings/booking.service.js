import Booking from "./Booking.model.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../core/utils/Errors.js";
import BookingAssignment from "../bookingAssignment/BookingAssignment.model.js";
import mongoose from "mongoose";
import { dispatchBooking } from "../../core/utils/Dispatchservice.js";
import { getUserProfile } from "../users/user.service.js";
import { notifyBookingCancelled } from "../notifications/Notification.service.js";
import req from "express/lib/request.js";

export const orderService = async (
  service,
  selectedOptions,
  price,
  scheduledDate,
  duration,
  location,
  notes,
  userId,
) => {
  try {
    const booking = await Booking.create({
      user: userId,
      service,
      selectedOptions,
      price,
      scheduledDate,
      duration,
      location,
      notes,
      totalAmount: 0,
    });

    const dispatch = await dispatchBooking(booking._id).catch((err) => ({
      dispatched: false,
      reason: err.message,
    }));

    return { booking, dispatch };
  } catch (err) {
    throw err;
  }
};

export const fetchBookings = async (
  status,
  page = 1,
  limit = 5,
  sort = "-createdAt",
  user,
  id,
  dateFrom,
  dateTo,
) => {
  try {
    const filter = {};

    if (user.role !== "admin") {
      if (user.role === "user") {
        filter.user = new mongoose.Types.ObjectId(user.id);
      }
    }
    if (id) {
      filter._id = new mongoose.Types.ObjectId(id);
    }
    if (dateFrom || dateTo) {
      filter.scheduledDate = {};
      if (dateFrom) filter.scheduledDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.scheduledDate.$lte = end;
      }
    }
    if (status) filter.status = status;
    console.log(filter);
    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("service", "name category")
        .populate("user", "name phone profileImage email")
        .populate({
          path: "worker",
          select:
            "nationalIdFront nationalIdBack licenseImage availabilityStatus bio categories",
          populate: {
            path: "user",
            select: "firstName lastName phone profileImage email",
          },
        })
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return {
      bookings,
      total,
    };
  } catch (err) {
    throw err;
  }
};

export const fetchBooking = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("service", "name category")
      .populate("worker", "name phone profileImage address location rating")
      .populate("user", "name phone email profileImage address location rating")
      .populate("review");

    if (!booking) throw new NotFoundError("Booking");
    return booking;
  } catch (err) {
    throw err.message;
  }
};

export const updateBooking = async (
  userId,
  id,
  scheduledDate,
  duration,
  notes,
  location,
  selectedOptions,
) => {
  try {
    const booking = await Booking.findById(id);
    const user = await getUserProfile(userId);
    console.log(user);
    if (!booking) throw new NotFoundError("Booking");

    if (user.role === "user") {
      if (!booking.canBeRescheduled()) {
        throw new ValidationError("Booking cannot be modified at this stage");
      }
    }

    if (scheduledDate) booking.scheduledDate = scheduledDate;
    if (duration) booking.duration = duration;
    if (notes) booking.notes = notes;
    if (location) booking.location = location;
    if (selectedOptions) booking.selectedOptions = selectedOptions;

    await booking.save();
    return booking;
  } catch (err) {
    throw err;
  }
};

export const cancelBookingById = async (id, user, reason) => {
  try {
    const booking = await Booking.findById(id).populate("service", "name");

    if (!booking) throw new NotFoundError("Booking");

    if (user.role === "user") {
      if (!booking.canBeCancelled())
        throw new ValidationError(
          "Booking cannot be cancelled. Must be pending/accepted and >24h away.",
        );
    }

    booking.status = "cancelled";
    booking.cancellationReason = reason || "Cancelled by user";
    await booking.save();

    await BookingAssignment.updateMany(
      {
        booking: booking._id,
        status: { $in: ["sent", "viewed", "countered"] },
      },
      { status: "expired", responseNote: "Booking was cancelled" },
    );

    await notifyBookingCancelled(booking.user, {
      serviceName: booking.service?.name,
    });

    if (booking.worker) {
      await notifyBookingCancelled(booking.worker, {
        serviceName: booking.service?.name,
      });
    }

    return booking;
  } catch (err) {
    throw err;
  }
};

export const updateBookingStatus = async (id, status, note) => {
  try {
    const ALLOWED_TRANSITIONS = {
      pending: ["accepted", "cancelled"],
      accepted: ["in-progress", "cancelled"],
      "in-progress": ["completed"],
      completed: [],
      cancelled: ["refunded"],
      refunded: [],
    };

    const booking = await Booking.findById(id);
    if (!booking) throw new NotFoundError("Booking");
    const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      throw new ValidationError(
        `Cannot transition from '${booking.status}' to '${status}'`,
      );
    }

    booking.status = status;
    if (note) {
      booking.timeline.push({ status, timestamp: new Date(), note });
    }

    await booking.save();
    return booking;
  } catch (err) {
    throw err;
  }
};

export const getNearBookings = async (lng, lat, maxDistance) => {
  try {
    const bookings = await Booking.find({
      status: "pending",
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance),
        },
      },
    })
      .populate("service", "name category")
      .populate("user", "name phone")
      .limit(20)
      .lean();

    return bookings;
  } catch (err) {
    throw err;
  }
};

export const fetchBookingTimeline = async (id) => {
  try {
    const booking = await Booking.findById(id).select(
      "timeline status scheduledDate",
    );
    if (!booking) throw new NotFoundError("Booking");

    return booking;
  } catch (err) {
    throw err;
  }
};
