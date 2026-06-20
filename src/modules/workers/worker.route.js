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
  updateWorker,
  viewWorker,
  getWorkerDashboard,
  getMe,
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
  workerUpdatedSchema,
} from "./worker.validation.js";
import {
  checkPermission,
  checkPermissionAndRole,
} from "../../core/middleware/permissionMiddleware.js";

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
workerRouter.get("/dashboard", protect, getWorkerDashboard);
// workerRouter.get(
//   "/bookings",
//   protect,
//   authorize("worker"),
//   validate(workerBookingSchema),
//   getMyBookings,
// );

workerRouter.get("/me", protect, authorize("worker"), getMe);

workerRouter.get(
  "/:workerId/viewProfile",
  protect,
  authorize("user", "worker"),
  viewWorker,
);
workerRouter.patch(
  "/:id/complete",
  validate(workerCompletedSchema),
  protect,
  authorize("worker"),
  completeBooking,
);

workerRouter.delete("/me", protect, authorize("worker"), deleteMe);

workerRouter.get(
  "/:id",
  validate(getWorkerByIdSchema),
  protect,
  //isStaff,
  //checkPermissionAndRole("manage_users", "user"),
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
  "/:workerId/edit",
  validate(workerUpdatedSchema),
  protect,
  isStaff,
  checkPermission("manage_users"),
  updateWorker,
);

export default workerRouter;
