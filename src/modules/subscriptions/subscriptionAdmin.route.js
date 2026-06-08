import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as subscriptionController from "./subscription.controller.js";
import {
  validate,
  createPlanSchema,
  updatePlanSchema,
  addFeatureSchema,
  updateStatusSchema,
} from "./subscription.validation.js";

const router = express.Router();

router.use(protect, authorize("admin", "owner"));

// Plans CRUD 
router.get(
  "/plans",
  subscriptionController.adminGetAllPlans
);
router.get(
  "/plans/:id",
  subscriptionController.adminGetPlanById
);
router.post(
  "/plans",
  validate(createPlanSchema),
  subscriptionController.adminCreatePlan
);
router.patch(
  "/plans/:id",
  validate(updatePlanSchema),
  subscriptionController.adminUpdatePlan
);
router.delete(
  "/plans/:id",
  subscriptionController.adminDeletePlan
);

//  Features 
router.post(
  "/plans/:id/features",
  validate(addFeatureSchema),
  subscriptionController.adminAddFeature
);
router.delete(
  "/plans/:id/features/:featureIndex",
  subscriptionController.adminRemoveFeature
);

//  User Subscriptions 
router.get(
  "/users",
  subscriptionController.adminGetAllSubscriptions
);
router.patch(
  "/:id/status",
  validate(updateStatusSchema),
  subscriptionController.adminUpdateSubscriptionStatus
);

export default router;
