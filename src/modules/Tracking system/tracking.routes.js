import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import {
  updateLocation,
  getWorkerLocation,
  updateStatus,
  disableLocation,
} from "./tracking.controller.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/location", authorize("worker", "user"), updateLocation);
router.delete("/location", authorize("worker", "user"), disableLocation);
router.patch("/status", authorize("worker", "user"), updateStatus);

router.get("/worker/:workerId", getWorkerLocation);

export default router;
