import Router from "express";
import {
  getAllWorkers,
  getWorkerById,
  updateWorkerProfile,
  updateAvailability,
  updateLocation,
  toggleStatus,
  getMyAssignments,
  getMyReviews,
  completeBooking,
  deleteMe,
} from "./worker.controller.js";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize, isStaff } from "../../core/middleware/roleMiddleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
  availabilityStatusSchema,
  availabilityWorkerSchema,
  getWorkerByIdSchema,
  LocationWorkerSchema,
  updateWorkerSchema,
  workerBookingSchema,
  workerCompletedSchema,
  workerSearchSchema,
} from "./worker.validation.js";
import { checkPermission } from "../../core/middleware/permissionMiddleware.js";

const workerRouter = Router();

workerRouter.get(
  "/assignments",
  protect,
  authorize("worker"),
  getMyAssignments,
);
workerRouter.patch(
  "/update-me",
  validate(updateWorkerSchema),
  protect,
  authorize("worker"),
  updateWorkerProfile,
);
workerRouter.get("/my-reviews", protect, authorize("worker"), getMyReviews);

workerRouter.patch(
  "/location",
  validate(LocationWorkerSchema),
  protect,
  authorize("worker"),
  updateLocation,
);
workerRouter.patch(
  "/availability",
  protect,
  authorize("worker"),
  validate(availabilityWorkerSchema),
  updateAvailability,
);
workerRouter.patch(
  "/status",
  validate(availabilityStatusSchema),
  protect,
  authorize("worker"),
  toggleStatus,
);

// workerRouter.get(
//   "/bookings",
//   protect,
//   authorize("worker"),
//   validate(workerBookingSchema),
//   getMyBookings,
// );

// workerRouter.get("/me", protect, authorize("worker"), getMe);
workerRouter.get(
  "/:id",
  validate(getWorkerByIdSchema),
  protect,
  isStaff,
  checkPermission("manage_users"),
  getWorkerById,
);

workerRouter.get(
  "/",
  validate(workerSearchSchema),
  protect,
  isStaff,
  checkPermission("manage_users"),
  getAllWorkers,
);
workerRouter.patch(
  "/:id/complete",
  validate(workerCompletedSchema),
  protect,
  authorize("worker"),
  completeBooking,
);

workerRouter.delete("/me", protect, authorize("worker"), deleteMe);
export default workerRouter;
