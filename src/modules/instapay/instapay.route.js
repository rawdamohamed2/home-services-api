import express from "express";
import multer from "multer";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as instapayController from "./instapay.controller.js";
import { validate } from "../withdrawals/withdrawal.validation.js";
import { rejectWithdrawalSchema } from "../withdrawals/withdrawal.validation.js";

const router = express.Router();

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/"))
      return cb(new Error("Only image files are allowed"));
    cb(null, true);
  },
});

// ── Admin Routes — /api/admin/payments/instapay/... ───────
router.use(protect, authorize("admin", "owner"));

router.get("/",                                                   instapayController.adminGetInstapayPayments);
router.patch("/:id/approve",                                      instapayController.adminApproveInstapayPayment);
router.patch("/:id/reject",  validate(rejectWithdrawalSchema),    instapayController.adminRejectInstapayPayment);

export default router;
