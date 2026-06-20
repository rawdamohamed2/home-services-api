import ApiResponse from "../../core/utils/ApiResponse.js";
import {
  getUserProfile,
  updateUser,
  changeUserPassword,
  uploadProfileImage,
  deleteProfileImage,
  adminGetClients,
  adminGetClientById,
  adminUpdateClient,
  adminDeleteClient,
  adminGetClientPayments,
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

//  ADMIN — User Management (Clients)

// GET /api/admin/users/clients
export const adminListClients = async (req, res, next) => {
  try {
    const data = await adminGetClients(req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

// GET /api/admin/users/clients/:id
export const adminGetClient = async (req, res, next) => {
  try {
    const client = await adminGetClientById(req.params.id);
    return ApiResponse.success(res, client);
  } catch (error) { next(error); }
};

// PATCH /api/admin/users/clients/:id
export const adminEditClient = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    if (updateData.name) {
      const nameParts = updateData.name.trim().split(' ');
      
      if (nameParts.length === 1) {
        updateData.firstName = nameParts[0];
        updateData.lastName = '';
      } else {
        updateData.firstName = nameParts.slice(0, -1).join(' ');
        updateData.lastName = nameParts.slice(-1).join(' ');
      }
      
      delete updateData.name;
    }
    
    const client = await adminUpdateClient(req.params.id, updateData);
    return ApiResponse.success(res, client, "Client updated successfully");
  } catch (error) { 
    next(error); 
  }
};

// DELETE /api/admin/users/clients/:id
export const adminRemoveClient = async (req, res, next) => {
  try {
    const result = await adminDeleteClient(req.params.id);
    return ApiResponse.success(res, result, "Client deleted successfully");
  } catch (error) { next(error); }
};

// GET /api/admin/users/clients/:id/payments
export const adminGetClientPaymentsHistory = async (req, res, next) => {
  try {
    const payments = await adminGetClientPayments(req.params.id, req.query);
    return ApiResponse.success(res, payments);
  } catch (error) { next(error); }
};
