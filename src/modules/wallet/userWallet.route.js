import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import * as walletController from "./wallet.controller.js";

const router = express.Router();

router.use(protect);

// ── Wallet Info for User ─────────────────────────────────
router.get("/me", walletController.getMyWallet);
router.get("/transactions", walletController.getMyTransactions);

export default router;