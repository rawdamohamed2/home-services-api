import { Router } from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { checkPermissionAndRole } from "../../core/middleware/permissionMiddleware.js";
import {
  createBooking,
  getBookings,
  getBooking,
  editBooking,
  cancelBooking,
  editBookingStatus,
  getNearbyBookings,
  getBookingTimeline,
  completeBooking,
  getCompletedBookings,
} from "./booking.controller.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
  BookingCompletedSchema,
  cancelBookingValidation,
  createBookingValidation,
  IdBookingValidation,
  nearByBookingValidation,
  searchBookingValidation,
  StatusBookingValidation,
  updateBookingValidation,
} from "./booking.validation.js";

const bookingRouter = Router();

bookingRouter.use(protect);

bookingRouter.get("/", validate(searchBookingValidation), getBookings);

bookingRouter.post(
  "/",
  authorize("user"),
  validate(createBookingValidation),
  createBooking,
);
bookingRouter.get(
  "/nearby",
  authorize("worker"),
  validate(nearByBookingValidation),
  getNearbyBookings,
);

bookingRouter.get(
  "/completed",
  authorize("user", "worker"),
  getCompletedBookings,
);

bookingRouter.get(
  "/:id",
  //checkPermissionAndRole("user", "manage_bookings"),
  validate(IdBookingValidation),
  getBooking,
);

bookingRouter.patch(
  "/:id",
  checkPermissionAndRole("user", "manage_bookings"),
  validate(updateBookingValidation),
  editBooking,
);

bookingRouter.patch(
  "/:id/cancel",
  //checkPermissionAndRole("user", "manage_bookings"),
  validate(cancelBookingValidation),
  cancelBooking,
);

bookingRouter.get(
  "/:id/timeline",
  checkPermissionAndRole("user", "manage_bookings"),
  validate(IdBookingValidation),
  getBookingTimeline,
);

bookingRouter.patch(
  "/:bookingId/complete",
  validate(BookingCompletedSchema),
  protect,
  //checkPermissionAndRole("manage_bookings"),
  completeBooking,
);

bookingRouter.patch(
  "/:id/status",
  checkPermissionAndRole("worker", "manage_bookings"),
  validate(StatusBookingValidation),
  editBookingStatus,
);

export default bookingRouter;
