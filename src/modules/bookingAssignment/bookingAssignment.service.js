import BookingAssignment from "./BookingAssignment.model.js";
import Booking from "../bookings/Booking.model.js";
import { ForbiddenError, NotFoundError } from "../../core/utils/Errors.js";
import {
  notifyBookingAccepted,
  notifyCounterAccepted,
  notifyCounterOffer,
  notifyCounterRejected,
  notifyWorkerAssigned,
} from "../notifications/Notification.service.js";
import WorkerProfile from "../workers/WorkerProfile.model.js";
import { onBookingAccepted } from "../../core/services/Bookingchat.integration.js";

export const getAssignment = async (id) => {
  const assignment = await BookingAssignment.findById(id);
  if (!assignment) throw new NotFoundError("Assignment");
  return assignment;
};
export const getWorkerId = async (userId) => {
  try {
    const worker = await WorkerProfile.findOne({
      user: userId,
    });
    return worker;
  } catch (err) {
    throw err;
  }
};
export const assertWorkerOwns = async (assignment, userId) => {
  const worker = await getWorkerId(userId);
  if (assignment.worker.toString() !== worker._id.toString()) {
    throw new ForbiddenError("This assignment does not belong to you");
  }
};
export const assertUserOwnsBooking = (booking, userId) => {
  if (booking.user.toString() !== userId)
    throw new ForbiddenError("This booking does not belong to you");
};

export const markAsViewed = async (assignment) => {
  if (assignment.status === "sent") {
    assignment.status = "viewed";
    await assignment.save();
  }
  return assignment;
};

export const acceptOffer = async (assignment) => {
  try {
    await assignment.accept();

    const booking = await Booking.findById(assignment.booking)
      .populate("service", "name category")
      .populate("user", "firstName lastName phone")
      .populate({
        path: "worker",
        select:
          "nationalIdFront nationalIdBack licenseImage availabilityStatus bio categories",
        populate: {
          path: "user",
          select: "firstName lastName phone profileImage email",
        },
      });

    await onBookingAccepted(booking);

    await notifyBookingAccepted(
      booking.user._id,
      {
        booking_id: booking._id.toString(),
        assignment_id: assignment._id.toString(),
        serviceName: booking.service.name,
        fair: booking.totalAmount,
        customer_name: `${booking.user.firstName} ${booking.user.lastName}`,
        worker_id: assignment.worker,
        worker_name: `${booking.worker.user.firstName} ${booking.worker.user.lastName}`,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
      },
      {
        workerName: `${booking.worker.user.firstName} ${booking.worker.user.lastName}`,
        serviceName: booking.service?.name,
      },
    );

    await notifyWorkerAssigned(
      assignment.worker,
      {
        booking_id: booking._id.toString(),
        assignment_id: assignment._id.toString(),
        serviceName: booking.service.name,
        fair: booking.totalAmount,
        customer_name: `${booking.user.firstName} ${booking.user.lastName}`,
        worker_id: assignment.worker,
        worker_name: `${booking.worker.user.firstName} ${booking.worker.user.lastName}`,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
      },
      {
        serviceName: booking.service?.name,
        scheduledDate: booking.scheduledDate,
      },
    );
    return { assignment, booking };
  } catch (err) {
    throw err;
  }
};

export const rejectOffer = async (assignment, reason) => {
  await assignment.reject(reason);
  return assignment;
};

export const counterOffer = async (assignment, counterPrice, note) => {
  try {
    await assignment.counter(counterPrice, note);

    const booking = await Booking.findById(assignment.booking)
      .populate("user", "_id firstName lastName")
      .populate("service", "name");

    const Assignment = await assignment.populate({
      path: "worker",
      select:
        "nationalIdFront nationalIdBack licenseImage availabilityStatus bio categories",
      populate: {
        path: "user",
        select: "firstName lastName phone profileImage email",
      },
    });

    await notifyCounterOffer(
      booking.user._id,
      {
        booking_id: booking._id.toString(),
        assignment_id: assignment._id.toString(),
        counter_price: counterPrice,
        original_price: Assignment.originalPrice,
        service_name: booking.service.name,
        customer_name: `${booking.user.firstName} ${booking.user.lastName}`,
        worker_id: assignment.worker,
        worker_name: `${Assignment.worker.user.firstName} ${Assignment.worker.user.lastName}`,
        status: booking.status,
        scheduled_date: booking.scheduledDate,
      },
      {
        workerName: `${Assignment.worker.user.firstName} ${Assignment.worker.user.lastName}`,
        counterPrice,
        originalPrice: Assignment.originalPrice,
      },
    );

    return Assignment;
  } catch (err) {
    throw err;
  }
};

export const acceptCounterOffer = async (assignmentId) => {
  try {
    const assignment = await BookingAssignment.findById(assignmentId)
      .populate({
        path: "booking",
        populate: { path: "service", select: "name" },
      })
      .populate({
        path: "worker",
        select:
          "nationalIdFront nationalIdBack licenseImage availabilityStatus bio categories",
        populate: {
          path: "user",
          select: "firstName lastName phone profileImage email",
        },
      });
    if (!assignment) throw new NotFoundError("Assignment");

    await assignment.userAccept();

    await notifyCounterAccepted(
      assignment.worker,
      {
        booking_id: assignment.booking.toString(),
        assignment_id: assignment._id.toString(),
        final_price: assignment.finalPrice,
        service_name: assignment.booking?.service?.name,
        worker_id: assignment.worker,
        worker_name: `${assignment.worker.user.firstName} ${assignment.worker.user.lastName}`,
        status: assignment.status,
      },
      {
        finalPrice: assignment.finalPrice,
        serviceName: assignment.booking?.service?.name,
      },
    );

    return assignment;
  } catch (err) {
    throw err;
  }
};

export const rejectCounterOffer = async (assignmentId) => {
  try {
    const assignment = await BookingAssignment.findById(assignmentId)
      .populate({
        path: "booking",
        populate: { path: "service", select: "name" },
      })
      .populate({
        path: "worker",
        select:
          "nationalIdFront nationalIdBack licenseImage availabilityStatus bio categories",
        populate: {
          path: "user",
          select: "firstName lastName phone profileImage email",
        },
      });

    if (!assignment) throw new NotFoundError("Assignment");

    await assignment.userReject();

    await notifyCounterRejected(
      assignment.worker,
      {
        booking_id: assignment.booking.toString(),
        assignment_id: assignment._id.toString(),
        counter_price: assignment.counterPrice,
        service_name: assignment.booking?.service?.name,
        worker_id: assignment.worker,
        worker_name: `${assignment.worker.user.firstName} ${assignment.worker.user.lastName}`,
        status: assignment.status,
      },
      {
        counterPrice: assignment.counterPrice,
        serviceName: assignment.booking?.service?.name,
      },
    );

    return assignment;
  } catch (err) {
    throw err;
  }
};

export const fetchMyAssignments = async (
  userId,
  { status, page = 1, limit = 10 },
) => {
  const worker = await getWorkerId(userId);
  const filter = { worker: worker._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [assignments, total] = await Promise.all([
    BookingAssignment.find(filter)
      .populate({
        path: "booking",
        populate: { path: "service", select: "name category" },
      })
      .sort("-assignedAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    BookingAssignment.countDocuments(filter),
  ]);
  return { assignments, total };
};

export const fetchBookingAssignments = async (bookingId, requesterId, role) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking");

  if (booking.user.toString() !== requesterId && role !== "admin")
    throw new ForbiddenError();

  const assignments = await BookingAssignment.find({ booking: bookingId })
    .populate({
      path: "worker",
      select:
        "nationalIdFront nationalIdBack licenseImage availabilityStatus bio categories",
      populate: {
        path: "user",
        select: "firstName lastName phone profileImage email",
      },
    })
    .sort("assignmentOrder")
    .lean();

  return assignments;
};
