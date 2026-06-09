import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as withdrawalController from "./withdrawal.controller.js";
import {
  validate,
  withdrawalSchema,
} from "./withdrawal.validation.js";
import { addCardSchema, addInstapaySchema } from "../payments/payment.validation.js";

const router = express.Router();

router.use(protect, authorize("worker"));

// ── Withdrawal Methods ────────────────────────────────────
router.get("/methods",                                             withdrawalController.getMyWithdrawalMethods);
router.post("/methods/card",     validate(addCardSchema),          withdrawalController.addWorkerCard);
router.post("/methods/instapay", validate(addInstapaySchema),      withdrawalController.addWorkerInstapay);
router.delete("/methods/:id",                                      withdrawalController.deleteMyWithdrawalMethod);

// ── Withdraw ──────────────────────────────────────────────
router.post("/withdraw",         validate(withdrawalSchema),        withdrawalController.requestWithdrawal);
router.post("/withdraw/all",                                        withdrawalController.withdrawAll);

export default router;