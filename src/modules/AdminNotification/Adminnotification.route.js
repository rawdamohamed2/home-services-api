import { Router } from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import {
  composeNotification,
  getAdminNotifications,
  getAdminNotification,
  cancelNotification,
  duplicateNotification,
  retryFailedNotification,
} from "./Adminnotification.controller.js";
import { checkPermission } from "../../core/middleware/permissionMiddleware.js";

const router = Router();

router.use(protect);
router.use(checkPermission("manage_notifications"));

router.post("/", composeNotification);
router.get("/", getAdminNotifications);
router.get("/:id", getAdminNotification);
router.delete("/:id", cancelNotification);
router.post("/:id/duplicate", duplicateNotification);
router.post("/:id/retry", retryFailedNotification);

export default router;
