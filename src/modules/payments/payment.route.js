import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import * as paymentController from "./payment.controller.js";
import {
  validate,
  addCardSchema,
  addInstapaySchema,
  initiatePaymentSchema,
} from "./payment.validation.js";

// instapay route 
import { upload } from "../instapay/instapay.route.js";
import { verifyInstapayReceipt } from "../instapay/instapay.controller.js";

const router = express.Router();

router.use(protect);

// ── Payment Methods ───────────────────────────────────────
router.get("/methods",                                           paymentController.getMyPaymentMethods);
router.post("/methods/card",     validate(addCardSchema),        paymentController.addCard);
router.post("/methods/instapay", validate(addInstapaySchema),    paymentController.addInstapay);
router.delete("/methods/:id",                                    paymentController.deleteMyPaymentMethod);

// ── Payment Flow ──────────────────────────────────────────
router.post("/initiate",         validate(initiatePaymentSchema),paymentController.initiatePayment);
router.post("/:paymentId/verify-receipt", upload.single("image"),verifyInstapayReceipt);
router.post("/:paymentId/confirm",                               paymentController.confirmPayment);
router.get("/:paymentId/receipt",                                paymentController.getReceipt);

export default router;
