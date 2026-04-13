import User from './user.model.js';
import Wallet from '../payments/Wallet.model.js';
import WorkerProfile from '../workers/WorkerProfile.model.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { normalizePhone } from '../../core/utils/normalizePhone.js';
import { sendEmail } from '../../core/utils/sendEmail.js';

export const getUserProfile = async (userId) => {
    const user = await User.findById(userId)
        .select('-password -verifyOtp -verifyOtpExpires -resetOtpCode -resetOtpExpires')
        .populate('wallet', 'balance currency isActive')
        .lean();

    if (!user) {
        throw new Error('User not found');
    }

    
    const workerProfile = await WorkerProfile.findOne({ user: userId })
        .select('bio categories experienceYears city approvalStatus ratingAverage completedJobs availability availabilityStatus')
        .populate('categories', 'name')
        .lean();

    return {
        ...user,
        workerProfile: workerProfile || null
    };
};


export const updateUser = async (userId, updateData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { firstName, lastName, email, phone, address, location, enabledLocation } = updateData;

        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        
        if (email) {
            const existingEmail = await User.findOne({ 
                email, 
                _id: { $ne: userId } 
            }).session(session);
            if (existingEmail) {
                throw new Error('Email already in use by another account');
            }
            user.email = email;
        }
        
        if (phone) {
            const normalizedPhone = normalizePhone(phone);
            const existingPhone = await User.findOne({ 
                phone: normalizedPhone, 
                _id: { $ne: userId } 
            }).session(session);
            if (existingPhone) {
                throw new Error('Phone number already in use by another account');
            }
            user.phone = normalizedPhone;
        }
        
        if (address) user.address = address;
        if (location) user.location = location;
        if (enabledLocation !== undefined) user.enabledLocation = enabledLocation;

        await user.save({ session });

        
        if (location || enabledLocation !== undefined) {
            await WorkerProfile.findOneAndUpdate(
                { user: userId },
                { lastLocationUpdate: new Date() },
                { session }
            );
        }

        await session.commitTransaction();

        
        return await getUserProfile(userId);
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};


export const changeUserPassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');
    if (!user) {
        throw new Error('User not found');
    }

    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }

    
    user.password = newPassword;
    await user.save();

    
    await sendEmail(
        user.email,
        'Password Changed Successfully',
        `Hello ${user.firstName},\n\nYour password has been changed successfully.\nIf you didn't make this change, please contact support immediately.`
    );

    return { message: 'Password changed successfully' };
};


export const uploadProfileImage = async (userId, profileImage) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.profileImage = profileImage;
    await user.save();

    return { profileImage: user.profileImage };
};


export const deleteProfileImage = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.profileImage = 'https://res.cloudinary.com/dlbgzpo7s/image/upload/v1773087860/user-profile-icon-vector-avatar-600nw-2558760599_czvcso.webp';
    await user.save();

    return { message: 'Profile image deleted successfully' };
};


export const deleteUserAccount = async (userId, reason) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        
        user.isBlocked = true;
        await user.save({ session });

        
        await Wallet.findOneAndUpdate(
            { owner: userId },
            { isActive: false },
            { session }
        );

        
        await WorkerProfile.findOneAndUpdate(
            { user: userId },
            { 
                approvalStatus: 'Suspended',
                availabilityStatus: 'offline'
            },
            { session }
        );

        await session.commitTransaction();

        
        await sendEmail(
            user.email,
            'Account Deleted',
            `Hello ${user.firstName},\n\nYour account has been successfully deleted.\nWe're sorry to see you go!`
        );

        return { message: 'Account deleted successfully' };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};