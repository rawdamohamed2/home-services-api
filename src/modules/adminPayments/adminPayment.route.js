import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as adminPaymentController from "./adminPayment.controller.js";
import Joi from "joi";

const router = express.Router();

// ── Validation ────────────────────────────────────────────
const validate = (schema, source = "body") =>
  (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    next();
  };

const revenueSchema = Joi.object({
  from: Joi.date().iso().optional(),
  to:   Joi.date().iso().min(Joi.ref("from")).optional().messages({
    "date.min": "End date must be after start date",
  }),
});

// ─────────────────────────────────────────────────────────
router.use(protect, authorize("admin", "owner"));

// ── Revenue & History ─────────────────────────────────────
router.get(
  "/revenue",
  validate(revenueSchema, "query"),
  adminPaymentController.adminGetRevenue
);
router.get(
  "/history",
  adminPaymentController.adminGetHistory
);

export default router;