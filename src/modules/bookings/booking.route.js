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
} from "./booking.controller.js";
import { authorize, isStaff } from "../../core/middleware/roleMiddleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
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
  "/:id/status",
  checkPermissionAndRole("worker", "manage_bookings"),
  validate(StatusBookingValidation),
  editBookingStatus,
);

export default bookingRouter;
