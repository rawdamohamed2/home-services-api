import errorHandler from "../../core/middleware/Errorhandler.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import BookingAssignment from "./BookingAssignment.model.js";
import {
  getAssignment,
  assertWorkerOwns,
  assertUserOwnsBooking,
  markAsViewed,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounterOffer,
  rejectCounterOffer,
  fetchMyAssignments,
  fetchBookingAssignments,
} from "./bookingAssignment.service.js";

// ── Worker: view ──────────────────────────────────────────────────────────────
export const viewAssignment = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const assignment = await getAssignment(id);
    await assertWorkerOwns(assignment, userId);

    const updated = await markAsViewed(assignment);

    ApiResponse.success(res, { assignment: updated });
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// ── Worker: accept at original price ─────────────────────────────────────────
export const acceptAssignment = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const assignment = await getAssignment(id);
    await assertWorkerOwns(assignment, userId);

    const { assignment: updated, booking } = await acceptOffer(assignment);

    ApiResponse.success(
      res,
      { assignment: updated, booking },
      "Booking accepted successfully",
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// ── Worker: reject ────────────────────────────────────────────────────────────
export const rejectAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const assignment = await getAssignment(id);
    await assertWorkerOwns(assignment, userId);

    const updated = await rejectOffer(assignment, reason);

    ApiResponse.success(res, { assignment: updated }, "Assignment rejected");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// ── Worker: counter price ─────────────────────────────────────────────────────
export const counterAssignment = async (req, res) => {
  try {
    const { counterPrice, note } = req.body;

    const assignment = await getAssignment(req.params.id);
    await assertWorkerOwns(assignment, req.user.id);

    const updated = await counterOffer(assignment, counterPrice, note);

    ApiResponse.success(
      res,
      { assignment: updated },
      `Counter offer of ${counterPrice} L.E sent to user`,
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// ── User: accept counter price ────────────────────────────────────────────────
export const userAcceptCounter = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const assignment = await acceptCounterOffer(id);
    assertUserOwnsBooking(assignment.booking, userId);

    ApiResponse.success(
      res,
      { assignment },
      `Deal confirmed at ${assignment.finalPrice} L.E`,
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// ── User: reject counter price ────────────────────────────────────────────────
export const userRejectCounter = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const assignment = await rejectCounterOffer(id);
    assertUserOwnsBooking(assignment.booking, userId);

    ApiResponse.success(res, { assignment }, "Counter offer rejected");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// ── Worker: get my assignments ────────────────────────────────────────────────
export const getMyAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = req.query;
    const { assignments, total } = await fetchMyAssignments(userId, filters);

    ApiResponse.sendPaginated(
      res,
      assignments,
      total,
      filters.page || 1,
      filters.limit || 5,
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// ── User/Admin: get all assignments for a booking ─────────────────────────────
export const getBookingAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { bookingId } = req.params;
    const assignments = await fetchBookingAssignments(bookingId, userId, role);

    ApiResponse.success(res, { assignments, count: assignments.length });
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// ── Admin: expire old assignments ─────────────────────────────────────────────
export const expireAssignments = async (req, res) => {
  try {
    const count = await BookingAssignment.expireOldAssignments();
    ApiResponse.success(
      res,
      { expiredCount: count },
      `${count} assignment(s) expired`,
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};
