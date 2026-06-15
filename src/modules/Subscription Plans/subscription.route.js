import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import * as subscriptionController from "./subscription.controller.js";
import { validate, subscribeSchema } from "./subscription.validation.js";

const router = express.Router();

// ── Public login ───────────────────────────────
router.get("/plans",      subscriptionController.getAllPlans);
router.get("/plans/:id",  subscriptionController.getPlanById);

// ── Protected login ──────────────────────────────
router.use(protect);

router.get(
  "/my-subscriptions",
  subscriptionController.getMySubscriptions
);
router.get(
  "/my-subscriptions/:id",
  subscriptionController.getMySubscriptionById
);
router.post(
  "/subscribe",
  validate(subscribeSchema),
  subscriptionController.subscribe
);
router.post(
  "/:id/cancel",
  subscriptionController.cancelSubscription
);
router.post(
  "/:id/renew",
  subscriptionController.renewSubscription
);

export default router;
