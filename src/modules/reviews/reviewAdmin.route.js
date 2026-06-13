import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as reviewController from "./review.controller.js";
import { validate, reportActionSchema } from "./review.validation.js";

const router = express.Router();

router.use(protect, authorize("admin", "owner"));

//  Comment Reports 
router.get("/reports",     reviewController.adminGetReports);
router.get("/reports/:id", reviewController.adminGetReportById);

//  Actions — Ignore / Remove / Mute 
router.patch(
  "/reports/:id/ignore",
  validate(reportActionSchema),
  reviewController.adminIgnoreReport
);
router.patch(
  "/reports/:id/remove-comment",
  validate(reportActionSchema),
  reviewController.adminRemoveComment
);
router.patch(
  "/reports/:id/mute-user",
  validate(reportActionSchema),
  reviewController.adminMuteUser
);

export default router;
