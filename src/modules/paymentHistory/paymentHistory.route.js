import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { getMyPaymentsHistory } from "./paymentHistory.controller.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMyPaymentsHistory);

export default router;