import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import * as userWalletController from "./userWallet.controller.js";

const router = express.Router();

router.use(protect);

// Wallet Info
router.get("/me", userWalletController.getMyWallet);

// Payment History (Booking Payments + Subscriptions)
router.get("/transactions", userWalletController.getMyTransactions);
router.get("/payments", userWalletController.getMyPayments);
router.get("/subscriptions", userWalletController.getMySubscriptionsPayments);

export default router;