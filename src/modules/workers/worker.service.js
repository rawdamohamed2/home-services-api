import WorkerProfile from "./WorkerProfile.model.js";
import User from "../users/user.model.js";
import Booking from '../bookings/Booking.model.js';
import Service from '../services/Service.model.js';
import mongoose from "mongoose";
import Wallet from '../payments/Wallet.model.js';
import BookingAssignment from '../bookings/BookingAssignment.model.js';
import Review from '../reviews/Review.model.js';
import Category from '../categories/Category.model.js';
import {normalizePhone} from "../../core/utils/normalizePhone.js";

export const fetchAllWorkers = async (filters) => {

    const { page = 1, limit = 10, category, status } = filters;
    const query = {};
    const skip = (parseInt(page) - 1) * parseInt(limit);


    if (status) {
        query.approvalStatus = status.trim();
    }

    if (category) {
        const categoryDoc = await Category.findOne({ name: category });

        if (categoryDoc) {
            query.categories = categoryDoc._id;
        } else {
            return { workers: [], total: 0, page: parseInt(page), limit: parseInt(limit) };
        }
    }


    const [workers, total] = await Promise.all([
        WorkerProfile.find(query)
            .select('bio experienceYears city approvalStatus ratingAverage availability isAvailable')
            .populate('user', 'firstName lastName profileImage')
            .populate({ path: 'categories', select: 'name' })
            .limit(parseInt(limit))
            .skip(skip)
            .sort('-ratingAverage'),
        WorkerProfile.countDocuments(query)
    ]);

    return {
        workers,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
    };
};

export const fetchWorkerById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid Worker ID format');
    }
    const workerProfile = await WorkerProfile.findOne({
        $or: [
            { _id: id },
            { user: id }
        ]
    })
        .select('bio experienceYears city approvalStatus ratingAverage availability isAvailable')
        .populate('user', 'firstName lastName email phone profileImage address isBlocked') // أضفت isBlocked هنا للتأكد
        .populate('categories', 'name');

    if (!workerProfile) {
        throw new Error('No worker profile found.');
    }

    if (workerProfile.user && workerProfile.user.isBlocked) {
        throw new Error('This worker account is currently suspended.');
    }

    return workerProfile;
};

export const updateWorkerFullProfile = async (userId, updateBody) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { firstName, email, phone, password, lastName, ...workerData } = updateBody;
        const user = await User.findById(userId).select('+password').session(session);
        if (!user) throw new Error('User not found');

        const normalizedPhone = normalizePhone(phone);

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (phone) user.phone = normalizedPhone;

        if (password && password.trim() !== "") {
            user.password = password;
        }
        await user.save({ session });

        const updatedWorker = await WorkerProfile.findOneAndUpdate(
            { user: userId },
            { $set: workerData },
            {
                returnDocument: 'after',
                runValidators: true,
                session
            }
        ).populate('user', 'firstName email phone');

        if (!updatedWorker) throw new Error('Worker profile not found');

        await session.commitTransaction();
        return updatedWorker;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }

};

export const getFullWorkerProfile = async (userId) => {
    const profile = await WorkerProfile.findOne({ user: userId })
        .populate('user', 'firstName lastName email phone profileImage isVerified')
        .populate('categories', 'name')
        .select('experienceYears bio approvalStatus');

    if (!profile) throw new Error('Worker profile not found');

    const wallet = await Wallet.findOne({ owner: userId });

    return { profile, wallet };
};

export const updateGeoLocation = async (userId, lat, lng) => {
    if (!userId) throw new Error("User ID is required");

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            location: {
                type: 'Point',
                coordinates: [Number(lng), Number(lat)]
            },
            enabledLocation: true
        },
        {
            returnDocument: 'after',
            runValidators: true
        }
    ).select("firstName location lastName");

    if (!updatedUser) {
        throw new Error("User not found");
    }

    return updatedUser;
};

export const updateAvailabilityStatus = async (userId, status) => {
    const profile = await WorkerProfile.findOneAndUpdate(
        { user: userId },
        { availabilityStatus: status },
        {
            returnDocument:"after",
            new: true, // مرادف لـ returnDocument: 'after'
            runValidators: true
        }
    )
        .select("availabilityStatus availability")
        .populate('user', 'firstName email phone');

    if (!profile) {
        throw new Error('Worker profile not found');
    }

    return profile;
};

export const getPendingAssignments = async (userId) => {
    const workerProfile = await WorkerProfile.findOne({ user: userId });

    if (!workerProfile) {
        throw new Error('This user does not have a worker profile');
    }
    const pendingAssignments = await BookingAssignment.find({
        worker: workerProfile._id,
        status: { $in: ['sent', 'viewed'] },
        expiryTime: { $gt: new Date() }
    })
        .populate({
            path: 'booking',
            populate: [
                { path: 'user', select: 'firstName profileImage' },
                { path: 'service', select: 'name' }
            ]
        })
        .sort('-assignedAt');
    return pendingAssignments;
};

export const getWorkerBookings = async (userId, status) => {
    const workerProfile = await WorkerProfile.findOne({ user: userId });

    if (!workerProfile) {
        throw new Error('This user does not have a worker profile');
    }
    const query = { worker: workerProfile._id };

    if (status) {
        query.status = status;
    } else {
        query.status = { $in: ['accepted', 'in-progress', 'completed'] };
    }
    const Bookings = await Booking.find(query)
        .populate('user', 'firstName lastName phone profileImage')
        .populate('service', 'name')
        .sort('-scheduledDate');

    return Bookings;
};

export const getWorkerReviews = async (userId) => {
    const workerProfile = await WorkerProfile.findOne({ user: userId });

    if (!workerProfile) {
        throw new Error('This user does not have a worker profile');
    }
    const reviews = await Review.find({ worker: workerProfile._id })
        .populate('user', 'firstName lastName email profileImage')
        .sort('-createdAt');

    return reviews;
};

export const uploadProfileImage = async (userId, profileImage) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Worker profile not found');
    }
    user.profileImage = profileImage;
    user.save();

}

export const deleteProfileImage = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Worker profile not found');
    }
    user.profileImage = "";
    user.save();

};

export const updateWorkerAvailability = async (userId,availability) => {

    const workerProfile = await WorkerProfile.findOne(
        { user: userId }
    ).select("availabilityStatus availability")
     .populate('user', 'firstName email phone');

    if (!workerProfile) {
        throw new Error('Worker profile not found');
    }
    if (availability) workerProfile.availability = availability;

    await workerProfile.save();

    return workerProfile;
}