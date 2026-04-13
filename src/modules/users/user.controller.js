import ApiResponse from '../../core/utils/ApiResponse.js';
import {
    getUserProfile,
    updateUser,
    changeUserPassword,
    uploadProfileImage,
    deleteProfileImage,
    deleteUserAccount
} from './user.service.js';


export const getMyProfile = async (req, res) => {
    try {
        const user = await getUserProfile(req.user._id);
        return ApiResponse.success(res, user, 'Profile fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const updatedUser = await updateUser(req.user._id, req.body);
        return ApiResponse.success(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};


export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await changeUserPassword(req.user._id, currentPassword, newPassword);
        return ApiResponse.success(res, result, 'Password changed successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};


export const uploadPhoto = async (req, res) => {
    try {
        const { profileImage } = req.body;
        const result = await uploadProfileImage(req.user._id, profileImage);
        return ApiResponse.success(res, result, 'Profile image uploaded successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};


export const deletePhoto = async (req, res) => {
    try {
        const result = await deleteProfileImage(req.user._id);
        return ApiResponse.success(res, result, 'Profile image deleted successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};


export const deleteAccount = async (req, res) => {
    try {
        const { reason } = req.body;
        const result = await deleteUserAccount(req.user._id, reason);
        
        
        res.cookie('token', "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            expires: new Date(0),
        });
        
        return ApiResponse.success(res, result, 'Account deleted successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};