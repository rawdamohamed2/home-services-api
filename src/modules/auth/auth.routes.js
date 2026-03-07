import {Router} from 'express';
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
    verifyResetOtp
} from "./auth.controller.js";
import {protect} from "../../core/middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post('/register/user', registerUser);
authRouter.post('/register/worker', registerWorker);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

authRouter.post('/send-verify-otp', protect, sendVerifyOtp);
authRouter.post('/verify-account', protect, verifyEmail);

authRouter.get('/is-auth', protect, isAuthenticated);

authRouter.post('/forgot-password', sendResetOtp);
authRouter.post('/verify-reset-otp', verifyResetOtp);
authRouter.post('/reset-password', resetPassword);


export default authRouter;