import { findNearbyWorkersByCategory } from "./Workerfinder.js";
import { AppError } from "../utils/Errors.js";
import Booking from "../../modules/bookings/Booking.model.js";
import BookingAssignment from "../../modules/bookingAssignment/BookingAssignment.model.js";
import { notifyNewOffer } from "../../modules/notifications/Notification.service.js";

export const dispatchBooking = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate("service", "name category")
    .populate("user", "firstName lastName");

  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.status !== "pending")
    throw new AppError("Only pending bookings can be dispatched", 400);

  const workers = await findNearbyWorkersByCategory({
    coordinates: booking.location.coordinates,
    categoryId: booking.service?.category,
    maxDistance: Number(process.env.WORKER_SEARCH_RADIUS_METERS) || 10000,
    limit: Number(process.env.MAX_WORKERS_PER_BOOKING) || 5,
  });

  if (workers.length === 0) {
    return {
      dispatched: false,
      reason: "No available workers nearby in this category",
    };
  }

  const assignments = await BookingAssignment.sendToWorkers(
    bookingId,
    workers.map((w) => ({
      workerId: w.workerId,
      originalPrice: booking.totalAmount,
    })),
  );

  const notifyPromises = workers.map((w) => {
    const workerAssignment = assignments.find(
      (a) => a.worker.toString() === w.workerId.toString(),
    );

    if (!workerAssignment) return Promise.resolve();

    return notifyNewOffer(
      w.workerUserId,
      {
        serviceName: booking.service?.name,
        price: booking.totalAmount,
        booking_id: booking._id,
        location: booking.location,
        scheduledDate: booking.scheduledDate,
        assignment_id: workerAssignment._id,
      },
      {
        serviceName: booking.service?.name,
        price: booking.totalAmount,
      },
    ).catch((err) => console.error("Failed to notify worker:", err));
  });
  await Promise.all(notifyPromises);

  return {
    dispatched: true,
    workersNotified: workers.length,
    assignments: assignments.map((a) => a._id),
  };
};
