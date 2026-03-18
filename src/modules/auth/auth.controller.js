import User from '../users/user.model.js';
import ApiResponse from "../../core/utils/ApiResponse.js";
import mongoose from "mongoose";
import {
    checkExistingUser, checkOtp,
    createBaseAccount,
    createWorkerAccount,
    generateAndSendOTP,
    prepareAuthData,
    updateLastLogin,
    processPasswordReset
} from "./auth.service.js";


const sendAuthResponse = (res, user, token, message, extraData = {}) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success(res, { user, token, ...extraData }, message);
};


export const registerUser = async (req,res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { email, phone } = req.body;
        await checkExistingUser(email, phone);
        const user = await createBaseAccount(req.body, 'user', session);
        const { token } = await prepareAuthData(user);
        await sendAuthResponse(res, user, token, "user created successfully", null);
    }
    catch(error) {
        await session.abortTransaction();
        return ApiResponse.error(res, error.message);
    }
    finally {
        session.endSession();
    }
};

export const registerWorker = async (req,res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {firstName, lastName, email, password, phone, enabledLocation, location, profileImage, ...otherData} = req.body;
        await checkExistingUser(email, phone);

        const userData = {
            firstName,
            lastName,
            email,
            password,
            phone,
            enabledLocation,
            location,
            profileImage,
            role: 'worker'
        }

        const user = await createBaseAccount(userData, 'worker', session);

        const workerData = {
            user: user._id,
            ...otherData
        };

        const worker = await createWorkerAccount(workerData, session);

        const { token } = await prepareAuthData(user);

        const data = {
            user: user,
            workerData: worker,
        }

        await sendAuthResponse(res, data, token, "Worker created successfully", null);
    }
    catch(error) {
        return ApiResponse.validationError(res, error.message);
    }
    finally {
        session.endSession();
    }
};

export const login = async (req,res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {email, password} = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return ApiResponse.error(res,"User not exists with this email");
        }
        await user.comparePassword(password);
        user.checkBlock();
        await updateLastLogin(user);
        const { token } = await prepareAuthData(user);
        await sendAuthResponse(res, user, token,"user Login successfully",null);
    }
    catch (error) {
        return ApiResponse.error(res,error.message);
    }
    finally {
        session.endSession();
    }
};

export const logout = async (req, res) => {
    res.cookie('token', "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ?
            'none' : 'strict',
        expires: new Date(0),
    });
    return ApiResponse.success(res, null, "user Logout successfully");
};

export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await generateAndSendOTP(userId, "VerifyOtp");

        return ApiResponse.success(
            res,
            {
                id: user._id
            },
            "Verify Otp sent successfully to your email"
        );
    }
    catch(error) {
        return ApiResponse.error(res, error.message);
    }
};

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;
    try {
        const Id = await checkOtp(userId, otp, "verify");

        return ApiResponse.success(
            res,
            {
                data: {
                    verified: true,
                    userId: Id
                }
            },
            "Your Account has been verified");

    }
    catch (error){
        return ApiResponse.error(res,error.message);
    }
};

//send password reset otp
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    try {
       const user =  await generateAndSendOTP(email, "ResetOtp");


        return ApiResponse.success(
            res,
            {
                id: user._id
            },
            "OTP Send successfully to your email"
        );
    }
    catch (error) {
        return ApiResponse.error(res,error.message);
    }
};

export const isAuthenticated = async (req, res) => {
    try {
        return ApiResponse.success(res,null, "User Authenticated Successfully");
    }
    catch(error) {
        return ApiResponse.error(res,error.message);
    }
};

export const verifyResetOtp  = async (req, res) => {
    const { userId, otp } = req.body;
    try {
        const Id = await checkOtp(userId, otp, "reset")

        return ApiResponse.success(res,
            {
                id: Id
            },
            "OTP verified successfully"
        );

    }
    catch (error){
        return ApiResponse.error(res,error.message);
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        await processPasswordReset(userId, newPassword);

        return ApiResponse.success(res, null, "Password reset successfully");
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};