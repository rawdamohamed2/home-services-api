import User from './user.model.js';
import Wallet from '../wallet/Wallet.model.js';
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

    let adminProfile = null;
    if (user.role === 'admin' || user.role === 'owner' || user.role === 'moderator') {
        const AdminProfile = mongoose.model('AdminProfile');
        adminProfile = await AdminProfile.findOne({ userId })
            .select('role permissions department managedWorkers')
            .lean();
    }    

    return {
        ...user,
        workerProfile: workerProfile || null,
        adminProfile: adminProfile || null
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
        await session.endSession();
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

//  ADMIN — User Management (Clients)

// ── GET /api/admin/users/clients ───────────────────────────
export const adminGetClients = async (query = {}) => {
    const { page = 1, limit = 10, status, search } = query;

    const filter = { role: 'user' };

    if (status === 'active')    { filter.isMuted = false; }
    if (status === 'suspended') { filter.isMuted = true;  }

    if (search) {
        filter.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName:  { $regex: search, $options: 'i' } },
        ];
        if (mongoose.Types.ObjectId.isValid(search)) {
            filter.$or.push({ _id: new mongoose.Types.ObjectId(search) });
        }
    }

    const Booking          = mongoose.model('Booking');
    const UserSubscription = mongoose.model('UserSubscription');

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('firstName lastName email profileImage isMuted mutedUntil createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit)),
        User.countDocuments(filter),
    ]);

    const userIds = users.map(u => u._id);

    const [bookingCounts, subscriptionCounts] = await Promise.all([
        Booking.aggregate([
            { $match: { user: { $in: userIds } } },
            { $group: { _id: '$user', count: { $sum: 1 } } },
        ]),
        UserSubscription.aggregate([
            { $match: { user: { $in: userIds }, status: 'active' } },
            { $group: { _id: '$user', count: { $sum: 1 } } },
        ]),
    ]);

    const bookingMap      = Object.fromEntries(bookingCounts.map(b => [b._id.toString(), b.count]));
    const subscriptionMap = Object.fromEntries(subscriptionCounts.map(s => [s._id.toString(), s.count]));

    const clients = users.map((u, index) => ({
        id:            `cl-${(page - 1) * limit + index + 1}`,
        _id:           u._id,
        name:          `${u.firstName} ${u.lastName}`,
        email:         u.email,
        profileImage:  u.profileImage,
        status:        u.isMuted ? 'suspended' : 'active',
        totalBookings: bookingMap[u._id.toString()]      || 0,
        totalPlans:    subscriptionMap[u._id.toString()] || 0,
        memberSince:   u.createdAt,
    }));

    return {
        clients,
        pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    };
};

// ── GET /api/admin/users/clients/:id ──────────────────────
export const adminGetClientById = async (userId) => {
    const user = await User.findById(userId)
        .select('-password -verifyOtp -verifyOtpExpires -resetOtpCode -resetOtpExpires -refreshToken')
        .lean();

    if (!user) throw new Error('User not found');
    if (user.role !== 'user') throw new Error('This user is not a client');

    return {
        _id:          user._id,
        name:         `${user.firstName} ${user.lastName}`,
        firstName:    user.firstName,
        lastName:     user.lastName,
        email:        user.email,
        phone:        user.phone,
        profileImage: user.profileImage,
        status:       user.isMuted ? 'suspended' : 'active',
        isMuted:      user.isMuted,
        mutedUntil:   user.mutedUntil,
        memberSince:  user.createdAt,
    };
};

// ── PATCH /api/admin/users/clients/:id ────────────────────
// Name / Email / Phone / Status (active | suspended | delete handled separately)
export const adminUpdateClient = async (userId, updateData) => {
    const { firstName, lastName, email, phone, status } = updateData;

     const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.role !== 'user') throw new Error('This action is only for clients');

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName || '';

    if (email) {
        const existing = await User.findOne({ email, _id: { $ne: userId } });
        if (existing) throw new Error('Email already in use');
        user.email = email;
    }

    if (phone) {
        const normalizedPhone = normalizePhone(phone);
        const existing = await User.findOne({ phone: normalizedPhone, _id: { $ne: userId } });
        if (existing) throw new Error('Phone already in use');
        user.phone = normalizedPhone;
    }

    if (status === 'active') {
        user.isMuted    = false;
        user.mutedUntil = null;
    }
    if (status === 'suspended') {
        user.isMuted    = true;
        user.mutedUntil = null; // suspend يدوي — الأدمن هو اللي بيرجعه active
    }

    await user.save();
    return await adminGetClientById(userId);
};

//  DELETE /api/admin/users/clients/:id 
export const adminDeleteClient = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.role !== 'user') throw new Error('This action is only for clients');

    await user.deleteOne();
    return { message: 'User deleted successfully' };
};

//  GET /api/admin/users/clients/:id/payments 
export const adminGetClientPayments = async (userId, query = {}) => {
    const { search } = query;

    const Booking          = mongoose.model('Booking');
    const Payment          = mongoose.model('Payment');
    const UserSubscription = mongoose.model('UserSubscription');

    //  Bookings + Payments 
    const bookings = await Booking.find({ user: userId })
        .populate({
            path:     'service',
            select:   'name category',
            populate: { path: 'category', select: 'name' },
        })
        .sort({ createdAt: -1 })
        .lean();

    const bookingIds = bookings.map(b => b._id);
    const payments = await Payment.find({ booking: { $in: bookingIds } })
        .select('booking transactionId status amount platformFee createdAt')
        .lean();
    const paymentMap = Object.fromEntries(payments.map(p => [p.booking.toString(), p]));

    const bookingTransactions = bookings
        .filter(b => paymentMap[b._id.toString()]) // بس اللي ليها payment فعلي
        .map(b => {
            const payment = paymentMap[b._id.toString()];
            return {
                type:           'booking',
                serviceName:    b.service?.name           || 'N/A',
                categoryName:   b.service?.category?.name || 'N/A',
                amount:         payment.amount,
                fee:            payment.platformFee,
                netAmount:      payment.amount - payment.platformFee,
                date:           payment.createdAt,
                paymentStatus:  payment.status,
                bookingStatus:  b.status,
                transactionId:  payment.transactionId,
            };
        });

    //  Subscriptions
    const subscriptions = await UserSubscription.find({ user: userId })
        .populate('plan', 'name price discount')
        .sort({ createdAt: -1 })
        .lean();

    const subscriptionTransactions = subscriptions.map(s => ({
        type:               'subscription',
        planName:           s.plan?.name     || 'N/A',
        amount:              s.amountPaid,
        originalPrice:       s.plan?.price    || 0,
        discount:            s.plan?.discount || 0,
        startDate:           s.startDate,
        endDate:             s.endDate,
        date:                s.createdAt,
        subscriptionStatus:  s.status,
        paymentStatus:       'paid',
        transactionId:       s.transactionId,
        paymentMethod:       s.paymentType,
        renewalCount:        s.renewalCount,
    }));

    let all = [...bookingTransactions, ...subscriptionTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (search) {
        const s = search.toLowerCase();
        all = all.filter(t =>
            t.transactionId?.toLowerCase().includes(s) ||
            t.serviceName?.toLowerCase().includes(s)   ||
            t.planName?.toLowerCase().includes(s)
        );
    }

    return all;
};
