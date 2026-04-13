import User from '../users/user.model.js';
import Worker from '../workers/WorkerProfile.model.js';
import Wallet from '../payments/Wallet.model.js';
import {sendEmail} from "../../core/utils/sendEmail.js";
import {generateToken} from "../../core/utils/generateToken.js";
import {normalizePhone} from "../../core/utils/normalizePhone.js";
import mongoose from "mongoose"

export const checkExistingUser = async (email, phone) => {
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) throw new Error('User already exists with this email or phone');
    return false;
};

export const createBaseAccount = async (userData, role) => {
    const normalizedPhone = normalizePhone(userData.phone);
    const user = new User(
        {
            ...userData,
            phone: normalizedPhone,
            role
        }
    );
    await user.save();
    await Wallet.create({ owner: user._id });

    return user;
};

export const prepareAuthData = async (user, login ) => {
    const token = generateToken(user._id);

    if(login) {
        await sendEmail(
            user.email,
            "New Login Notification",
            `Hello ${user.firstName},\n\nSomeone just logged into your account.\nIf this wasn't you, please secure your account immediately.`
        );
    }
    else {
        await sendEmail(
            user.email,
            "Welcome to ServiGo",
            "Your account has been created successfully."
        );
    }

    return { token };
};

export const createWorkerAccount = async (workerData, session) => {

    const worker = new Worker(
        {
            ...workerData,
        }
    );
    await worker.save();

    return worker;
};

export const updateLastLogin = async (user) => {
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
};

export const processVerifyOtp = async (user) => {
    if (user.isVerified) {
        throw new Error("User is already verified");
    }

    const otp = user.createVerificationCode();
    if (!otp) {
        throw new Error("Failed to Generate Verification Otp");
    }
    await user.save();
    await sendEmail(
        user.email,
        "Account Verification OTP",
        `Your OTP is ${otp}. Verify your account using this OTP.`
    );
};

export const processResetOtp = async (user) => {
    const otp = user.createResetPasswordCode();
    if (!otp) {
        throw new Error("Failed to Generate Reset Otp");
    }
    await user.save();
    await sendEmail(
        user.email,
        "Password Reset OTP",
        `Your Otp for resetting your password is ${otp}. 
            Use this OTP to proceed with resetting your password.`
    );
};

const OTP_PROCESSORS = {
    VerifyOtp: processVerifyOtp,
    ResetOtp: processResetOtp,
};

export const generateAndSendOTP = async (credential, type) => {

    const user = await User.findOne({
        $or: [
            { email: credential },
            mongoose.Types.ObjectId.isValid(credential) ? { _id: credential } : { _id: null }
        ]
    });

    if (!user) {
        throw new Error("No account found with this id or email");
    }

    user.checkBlock();

    const processor = OTP_PROCESSORS[type];
    if (!processor) {
        throw new Error("Invalid OTP type requested");
    }
    await processor(user);
    return user;
};

export const checkOtp = async (userId, otp, type) => {

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid Worker ID format');
    }
    const fields = {
        verify: { code: 'verifyOtp', expires: 'verifyOtpExpires' },
        reset:  { code: 'resetOtpCode', expires: 'resetOtpExpires' }
    };
    const config = type === 'verify' ? fields.verify : fields.reset;

    const user = await User.findById(userId);

    if (!user) throw new Error("No account found");

    if (!user[config.code] || user[config.code] !== otp) {
        throw new Error("Invalid OTP code");
    }

    if (user[config.expires] < Date.now()) {
        throw new Error("OTP code has expired");
    }

    if (type === 'verify') {
        user.isVerified = true;
    } else {
        user.isOtpVerified = true;
    }

    user[config.code] = '';
    user[config.expires] = 0;

    await user.save();
    return user._id;
};

export const processPasswordReset = async (userId, newPassword) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid Worker ID format');
    }
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error("No account found with this ID");


    if (!user.isOtpVerified) {
        throw new Error("OTP not verified. Cannot reset password.");
    }


    user.password = newPassword;
    user.isOtpVerified = false;

    await user.save();

    await sendEmail(
        user.email,
        "Password Changed Successfully",
        `Hello ${user.firstName || 'User'},\n\nYour password has been changed successfully.`
    );

    return user;
};

