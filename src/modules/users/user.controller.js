import ApiResponse from "../../core/utils/ApiResponse.js";
import {
  getUserProfile,
  updateUser,
  changeUserPassword,
  uploadProfileImage,
  deleteProfileImage,
} from "./user.service.js";
import { ValidationError } from "../../core/utils/Errors.js";
import User from "./user.model.js";
import errorHandler from "../../core/middleware/Errorhandler.js";

export const getMyProfile = async (req, res) => {
  try {
    const user = await getUserProfile(req.user._id);
    return ApiResponse.success(res, user, "Profile fetched successfully");
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const updatedUser = await updateUser(req.user._id, req.body);
    return ApiResponse.success(
      res,
      updatedUser,
      "Profile updated successfully",
    );
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changeUserPassword(
      req.user._id,
      currentPassword,
      newPassword,
    );
    return ApiResponse.success(res, result, "Password changed successfully");
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
};

export const uploadPhoto = async (req, res) => {
  try {
    const { profileImage } = req.body;
    const result = await uploadProfileImage(req.user._id, profileImage);
    return ApiResponse.success(
      res,
      result,
      "Profile image uploaded successfully",
    );
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
};

export const deletePhoto = async (req, res) => {
  try {
    const result = await deleteProfileImage(req.user._id);
    return ApiResponse.success(
      res,
      result,
      "Profile image deleted successfully",
    );
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
};

export const addFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) throw new ValidationError("fcmToken is required");

    await User.findByIdAndUpdate(req.user.id, { fcmToken });

    ApiResponse.success(res, null, "FCM token updated");
  } catch (err) {
    errorHandler(err, req, res);
  }
};
