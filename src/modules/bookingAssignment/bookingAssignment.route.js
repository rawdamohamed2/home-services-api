import { Router } from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import {
  viewAssignment,
  acceptAssignment,
  rejectAssignment,
  counterAssignment,
  userAcceptCounter,
  userRejectCounter,
  getMyAssignments,
  getBookingAssignments,
  expireAssignments,
} from "./bookingAssignment.controller.js";
import {
  checkPermission,
  checkPermissionAndRole,
} from "../../core/middleware/permissionMiddleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
  bookingIdAssignmentValidation,
  counterAssignmentValidation,
  filterAssignmentValidation,
  IdAssignmentValidation,
  reasonAssignmentValidation,
} from "./bookingAssignment.validation.js";

const assignmentsRouter = Router();
assignmentsRouter.use(protect);

// ── Worker ────────────────────────────────────────────────────────────────────
assignmentsRouter.get(
  "/my",
  validate(filterAssignmentValidation),
  authorize("worker"),
  getMyAssignments,
);
assignmentsRouter.patch(
  "/:id/view",
  authorize("worker"),
  validate(IdAssignmentValidation),
  viewAssignment,
);
assignmentsRouter.patch(
  "/:id/accept",
  authorize("worker"),
  validate(IdAssignmentValidation),
  acceptAssignment,
);
assignmentsRouter.patch(
  "/:id/reject",
  authorize("worker"),
  validate(reasonAssignmentValidation),
  rejectAssignment,
);
assignmentsRouter.patch(
  "/:id/counter",
  authorize("worker"),
  validate(counterAssignmentValidation),
  counterAssignment,
);

// ── User (respond to counter offer) ──────────────────────────────────────────
assignmentsRouter.patch(
  "/:id/user-accept",
  checkPermissionAndRole("user", "manage_bookings"),
  validate(IdAssignmentValidation),
  userAcceptCounter,
);
assignmentsRouter.patch(
  "/:id/user-reject",
  checkPermissionAndRole("user", "manage_bookings"),
  validate(IdAssignmentValidation),
  userRejectCounter,
);

// ── View ──────────────────────────────────────────────────────────────────────
assignmentsRouter.get(
  "/booking/:bookingId",
  checkPermissionAndRole("user", "manage_bookings"),
  validate(bookingIdAssignmentValidation),
  getBookingAssignments,
);

// ── Admin ─────────────────────────────────────────────────────────────────────
assignmentsRouter.post(
  "/expire",
  checkPermission("manage_bookings"),
  expireAssignments,
);

export default assignmentsRouter;
