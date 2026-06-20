import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as dashboardController from "./dashboard.controller.js";

const router = express.Router();

router.use(protect, authorize("admin", "owner"));

router.get("/overview",        dashboardController.getOverview);
router.get("/recent-bookings", dashboardController.getRecentBookings);

export default router;
