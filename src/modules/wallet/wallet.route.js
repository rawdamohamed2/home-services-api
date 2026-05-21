import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as walletController from "./wallet.controller.js";

// withdrawal routes from withdrawals module
import withdrawalRouter from "../withdrawals/withdrawal.route.js";

const router = express.Router();

router.use(protect, authorize("worker"));

// ── Wallet Info ───────────────────────────────────────────
router.get("/me",               walletController.getMyWallet);
router.get("/transactions",     walletController.getMyTransactions);
router.get("/pending-earnings", walletController.getPendingEarnings);

// ── Withdrawal Routes (nested) ────────────────────────────
router.use("/withdrawal", withdrawalRouter);

export default router;
