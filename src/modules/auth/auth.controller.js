import User from "../users/user.model.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import mongoose from "mongoose";
import {
  checkExistingUser,
  checkOtp,
  createBaseAccount,
  createWorkerAccount,
  generateAndSendOTP,
  prepareAuthData,
  updateLastLogin,
  processPasswordReset,
} from "./auth.service.js";
import errorHandler from "../../core/middleware/Errorhandler.js";
import jwt from "jsonwebtoken";
import { AppError } from "../../core/utils/Errors.js";

const sendAuthResponse = (res, user, token, message, extraData = {}) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, { user, token, ...extraData }, message);
};

export const registerUser = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { email, phone } = req.body;
    await checkExistingUser(email, phone);

    const user = await createBaseAccount(req.body, "user", session);
    const { token, refreshToken } = await prepareAuthData(user);

    user.refreshToken = refreshToken;
    await user.save({ session, validateBeforeSave: false });

    await session.commitTransaction();
    return sendAuthResponse(res, user, token, "User created successfully");
  } catch (error) {
    await session.abortTransaction();
    errorHandler(error, req, res);
  } finally {
    await session.endSession();
  }
};

export const registerWorker = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      enabledLocation,
      location,
      profileImage,
      ...otherData
    } = req.body;

    await checkExistingUser(email, phone);

    // ✅ session بتتمرر صح دلوقتي
    const user = await createBaseAccount(
      {
        firstName,
        lastName,
        email,
        password,
        phone,
        enabledLocation,
        location,
        profileImage,
      },
      "worker",
      session,
    );

    const worker = await createWorkerAccount(
      { user: user._id, ...otherData },
      session,
    );

    const { token, refreshToken } = await prepareAuthData(user);
    user.refreshToken = refreshToken;
    await user.save({ session, validateBeforeSave: false });

    await session.commitTransaction();
    return sendAuthResponse(
      res,
      { user, workerData: worker },
      token,
      "Worker created successfully",
    );
  } catch (error) {
    await session.abortTransaction();
    errorHandler(error, req, res);
  } finally {
    await session.endSession();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return ApiResponse.error(res, "User does not exist with this email");
    }

    await user.comparePassword(password);
    user.checkBlock();
    await updateLastLogin(user);

    const { token, refreshToken } = await prepareAuthData(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return sendAuthResponse(res, user, token, "user Login successfully");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { fcmToken: null });
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      expires: new Date(0),
    });

    return ApiResponse.success(res, null, "user Logout successfully");
  } catch (err) {
    errorHandler(err, req, res);
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await generateAndSendOTP(userId, "VerifyOtp");

    return ApiResponse.success(
      res,
      {
        id: user._id,
      },
      "Verify Otp sent successfully to your email",
    );
  } catch (error) {
    errorHandler(error, req, res);
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
          userId: Id,
        },
      },
      "Your Account has been verified",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

//send password reset otp
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await generateAndSendOTP(email, "ResetOtp");

    return ApiResponse.success(
      res,
      {
        id: user._id,
      },
      "OTP Send successfully to your email",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    return ApiResponse.success(res, null, "User Authenticated Successfully");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const verifyResetOtp = async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const Id = await checkOtp(userId, otp, "reset");

    return ApiResponse.success(
      res,
      {
        id: Id,
      },
      "OTP verified successfully",
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    await processPasswordReset(userId, newPassword);

    return ApiResponse.success(res, null, "Password reset successfully");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token. Please login again.", 403);
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    return ApiResponse.success(
      res,
      { accessToken },
      "Token refreshed successfully",
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
};
