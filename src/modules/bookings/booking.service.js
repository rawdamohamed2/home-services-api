import Booking from "./Booking.model.js";
import { NotFoundError, ValidationError } from "../../core/utils/Errors.js";
import BookingAssignment from "../bookingAssignment/BookingAssignment.model.js";
import mongoose from "mongoose";
import { dispatchBooking } from "../../core/utils/Dispatchservice.js";
import { getUserProfile } from "../users/user.service.js";
import {
  notifyBookingCancelled,
  notifyBookingCreated,
  notifyBookingUpdated,
} from "../notifications/Notification.service.js";
import { fetchServiceById } from "../services/Service.service.js";
import {
  onBookingCancelled,
  onBookingCompleted,
} from "../../core/services/Bookingchat.integration.js";

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

    const Service = await fetchServiceById(service);
    const user = await getUserProfile(userId);

    await notifyBookingCreated(
      userId,
      {
        booking_id: booking._id,
        serviceName: Service.name,
        fair: booking.totalAmount,
        customer_name: `${user.firstName} ${user.lastName}`,
      },
      {
        serviceName: Service.name,
      },
    );
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
    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("service", "name category")
        .populate("user", "firstName lastName phone profileImage email")
        .populate({
          path: "worker",
          select:
            "nationalIdFront nationalIdBack licenseImage availabilityStatus bio categories",
          populate: {
            path: "user",
            select: "firstName lastName phone profileImage email",
          },
        })
        .populate("review")
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
      .populate(
        "user",
        "firstName lastName  phone email profileImage address location rating",
      )
      .populate({
        path: "worker",
        select:
          "nationalIdFront nationalIdBack licenseImage availabilityStatus bio categories",
        populate: {
          path: "user",
          select: "firstName lastName phone profileImage email",
        },
      });

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
    const booking = await Booking.findById(id)
      .populate("service", "name category")
      .populate("user", "firstName lastName phone email");

    if (!booking) throw new NotFoundError("Booking");

    if (!booking.canBeRescheduled()) {
      throw new ValidationError("Booking cannot be modified at this stage");
    }

    if (scheduledDate) booking.scheduledDate = scheduledDate;
    if (duration) booking.duration = duration;
    if (notes) booking.notes = notes;
    if (location) booking.location = location;
    if (selectedOptions) booking.selectedOptions = selectedOptions;

    await booking.save();

    await cancelBookingById(booking._id, userId);

    await notifyBookingUpdated(
      userId,
      {
        booking_id: booking._id.toString(),
        serviceName: booking.service.name,
        fair: booking.totalAmount,
        customer_name: `${booking.user.firstName} ${booking.user.lastName}`,
        status: booking.status,
      },
      {
        serviceName: booking.service.name,
      },
    );

    const { booking: newBooking, dispatch } = await orderService(
      booking.service._id,
      booking.selectedOptions,
      booking.price,
      booking.scheduledDate,
      booking.duration,
      booking.location,
      booking.notes,
      booking.user._id,
    );

    return { newBooking, dispatch };
  } catch (err) {
    throw err;
  }
};

export const cancelBookingById = async (id, user, reason) => {
  try {
    const booking = await Booking.findById(id)
      .populate("service", "name")
      .populate("user", "firstName lastName phone email");

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

    await onBookingCancelled(booking);

    await BookingAssignment.updateMany(
      {
        booking: booking._id,
        status: { $in: ["sent", "viewed", "countered"] },
      },
      { status: "expired", responseNote: "Booking was cancelled" },
    );

    await notifyBookingCancelled(
      booking.user,
      {
        booking_id: booking._id,
        serviceName: booking.service?.name,
        fair: booking.totalAmount,
        customer_name: `${booking.user.firstName} ${booking.user.lastName}`,
      },
      {
        serviceName: booking.service?.name,
      },
    );

    if (booking.worker) {
      await notifyBookingCancelled(
        booking.worker,
        {
          booking_id: booking._id,
          serviceName: booking.service?.name,
          fair: booking.totalAmount,
          customer_name: `${booking.user.firstName} ${booking.user.lastName}`,
        },
        {
          serviceName: booking.service?.name,
        },
      );
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
    if (booking.status === "completed") {
      await onBookingCompleted(booking);
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
