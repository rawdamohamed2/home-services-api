import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import * as userWalletController from "./userWallet.controller.js";

const router = express.Router();

router.use(protect);

// Wallet Info
router.get("/me", userWalletController.getMyWallet);

// Payment History (Booking Payments + Subscriptions combined)
router.get("/transactions", userWalletController.getMyTransactions);


export default router;