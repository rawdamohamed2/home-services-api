import Router from "express";
import {
  getAllWorkers,
  getWorkerById,
  updateWorkerProfile,
  updateAvailability,
  getMe,
  updateLocation,
  toggleStatus,
  getMyAssignments,
  getMyBookings,
  getMyReviews,
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
  protect,
  authorize("worker"),
  validate(updateWorkerSchema),
  updateWorkerProfile,
);
workerRouter.get("/my-reviews", protect, authorize("worker"), getMyReviews);
workerRouter.patch(
  "/location",
  protect,
  authorize("worker"),
  validate(LocationWorkerSchema),
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
  protect,
  authorize("worker"),
  validate(availabilityStatusSchema),
  toggleStatus,
);

workerRouter.get(
  "/bookings",
  protect,
  authorize("worker"),
  validate(workerBookingSchema),
  getMyBookings,
);

workerRouter.get("/me", protect, authorize("worker"), getMe);
workerRouter.get(
  "/:id",
  protect,
  isStaff,
  checkPermission("manage_users"),
  validate(getWorkerByIdSchema),
  getWorkerById,
);

workerRouter.get(
  "/",
  protect,
  isStaff,
  checkPermission("manage_users"),
  validate(workerSearchSchema),
  getAllWorkers,
);

workerRouter.delete("/me", protect, authorize("worker"), deleteMe);
export default workerRouter;
