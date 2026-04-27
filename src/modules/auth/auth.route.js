import { Router } from "express";
import {
  isAuthenticated,
  login,
  logout,
  registerUser,
  registerWorker,
  resetPassword,
  sendResetOtp,
  sendVerifyOtp,
  verifyEmail,
  verifyResetOtp,
} from "./auth.controller.js";
import { protect } from "../../core/middleware/authMiddleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
  userRegisterSchema,
  workerRegisterSchema,
  loginSchema,
  idSchema,
  verifyEmailSchema,
  emailSchema,
  resetPasswordSchema,
} from "./auth.validation.js";

const authRouter = Router();

authRouter.post("/register/user", validate(userRegisterSchema), registerUser);
authRouter.post(
  "/register/worker",
  validate(workerRegisterSchema),
  registerWorker,
);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", logout);

authRouter.post("/send-verify-otp", protect, validate(idSchema), sendVerifyOtp);
authRouter.post(
  "/verify-account",
  protect,
  validate(verifyEmailSchema),
  verifyEmail,
);

authRouter.get("/is-auth", protect, isAuthenticated);

authRouter.post("/forgot-password", validate(emailSchema), sendResetOtp);
authRouter.post(
  "/verify-reset-otp",
  validate(verifyEmailSchema),
  verifyResetOtp,
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword,
);

export default authRouter;
