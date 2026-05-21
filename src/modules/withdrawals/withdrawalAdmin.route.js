import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as withdrawalController from "./withdrawal.controller.js";
import { validate, rejectWithdrawalSchema } from "./withdrawal.validation.js";

const router = express.Router();

router.use(protect, authorize("admin", "owner"));

// ── Admin Withdrawals — /api/admin/payments/withdrawals/...
router.get(
  "/",
  withdrawalController.adminGetWithdrawals
);
router.patch(
  "/:id/approve",
  withdrawalController.adminApproveWithdrawal
);
router.patch(
  "/:id/reject",
  validate(rejectWithdrawalSchema),
  withdrawalController.adminRejectWithdrawal
);

export default router;