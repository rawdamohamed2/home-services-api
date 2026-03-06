import {Router} from 'express';
import {
    isAuthenticated,
    login,
    logout,
    register, resetPassword,
    sendResetOtp,
    sendVerifyOtp,
    verifyEmail,
    verifyResetOtp
} from "./auth.controller.js";
import {protect} from "../../core/middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

authRouter.post('/send-verify-otp', protect, sendVerifyOtp);
authRouter.post('/verify-account', protect, verifyEmail);

authRouter.post('/is-auth', protect, isAuthenticated);

authRouter.post('/forgot-password', protect, sendResetOtp);
authRouter.post('/verify-reset-otp', protect, verifyResetOtp);
authRouter.post('/reset-password', protect, resetPassword);


export default authRouter;