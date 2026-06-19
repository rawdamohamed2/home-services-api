import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as userController from "./user.controller.js";
import { validate, adminUpdateClientSchema } from "./user.validation.js";

const router = express.Router();

router.use(protect, authorize("admin", "owner"));

// ── Clients List + Search + Status Filter ─────────────────
router.get("/clients", userController.adminListClients);

// ── Client Info Page ───────────────────────────────────────
router.get("/clients/:id", userController.adminGetClient);
router.patch(
  "/clients/:id",
  validate(adminUpdateClientSchema),
  userController.adminEditClient
);
router.delete("/clients/:id", userController.adminRemoveClient);

// ── Recent Payments (bookings + subscriptions) ─────────────
router.get("/clients/:id/payments", userController.adminGetClientPaymentsHistory);

export default router;
