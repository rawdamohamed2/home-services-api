import WorkerProfile from "./WorkerProfile.model.js";
import User from "../users/user.model.js";
import Booking from "../bookings/Booking.model.js";
import mongoose from "mongoose";
import BookingAssignment from "../bookingAssignment/BookingAssignment.model.js";
import Review from "../reviews/Review.model.js";
import Category from "../categories/Category.model.js";
import { changeUserPassword, updateUser } from "../users/user.service.js";
import { AppError, NotFoundError } from "../../core/utils/Errors.js";
import { notifyBookingCompleted } from "../notifications/Notification.service.js";
import { fetchBookings } from "../bookings/booking.service.js";
import { normalizePhone } from "../../core/utils/normalizePhone.js";
import { timeRegex, validDays } from "../../core/utils/validation.helper.js";
import { onBookingCompleted } from "../../core/services/Bookingchat.integration.js";

export const getUserIdsByName = async (name) => {
  try {
    if (!name) return null;
    const users = await User.find({
      $or: [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ],
    }).select("_id");
    return users.map((u) => u._id);
  } catch (error) {
    throw new Error(error.message);
  }
};
export const getCategoryIdByName = async (categoryName) => {
  try {
    if (!categoryName) return null;
    const categoryDoc = await Category.findOne({
      name: { $regex: `^${categoryName}$`, $options: "i" },
    });
    return categoryDoc ? categoryDoc._id : "NOT_FOUND";
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getWorkerId = async (userId) => {
  try {
    const worker = await WorkerProfile.findOne({ user: userId });
    if (!worker) return NotFoundError("Worker");
    return worker._id;
  } catch (error) {
    throw error;
  }
};

export const updateWorkerFullProfile = async (userId, updateBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { firstName, email, phone, password, lastName, ...workerData } =
      updateBody;

    const updatedUser = {
      firstName,
      lastName,
      email,
      phone,
    };

    await updateUser(userId, updatedUser);

    await changeUserPassword(userId, password, password);

    const updatedWorker = await WorkerProfile.findOneAndUpdate(
      { user: userId },
      { $set: workerData },
      {
        returnDocument: "after",
        runValidators: true,
        session,
      },
    ).populate("user", "firstName email phone");

    if (!updatedWorker) throw new Error("Worker profile not found");

    await session.commitTransaction();
    return updatedWorker;
  } catch (error) {
    await session.abortTransaction();
    throw e;
  } finally {
    await session.endSession();
  }
};

// export const getFullWorkerProfile = async (userId) => {
//   try {
//     const profile = await WorkerProfile.findOne({ user: userId })
//       .populate(
//         "user",
//         "firstName lastName email phone profileImage isVerified",
//       )
//       .populate("categories", "name")
//       .select(
//         "experienceYears city availabilityStatus availability bio approvalStatus createdAt",
//       );
//
//     if (!profile) throw new Error("Worker profile not found");
//
//     const wallet = await Wallet.findOne({ owner: userId }).select(
//       "balance currency isActive",
//     );
//
//     return { profile, wallet };
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

export const updateGeoLocation = async (userId, lat, lng) => {
  if (!userId) throw new Error("User ID is required");
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        enabledLocation: true,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).select("firstName location lastName");

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  } catch (e) {
    throw e;
  }
};

export const updateAvailabilityStatus = async (userId, status) => {
  try {
    const profile = await WorkerProfile.findOneAndUpdate(
      { user: userId },
      { availabilityStatus: status },
      {
        returnDocument: "after",
        new: true, // مرادف لـ returnDocument: 'after'
        runValidators: true,
      },
    )
      .select("availabilityStatus availability")
      .populate("user", "firstName email phone");

    if (!profile) {
      throw new Error("Worker profile not found");
    }

    return profile;
  } catch (e) {
    throw e;
  }
};

export const getPendingAssignments = async (userId) => {
  try {
    const workerProfile = await WorkerProfile.findOne({ user: userId });

    if (!workerProfile) {
      throw new Error("This user does not have a worker profile");
    }
    console.log(workerProfile);
    const pendingAssignments = await BookingAssignment.find({
      worker: workerProfile._id,
      status: { $in: ["sent", "viewed"] },
      expiryTime: { $gt: new Date() },
    })
      .populate({
        path: "booking",
        populate: [
          { path: "user", select: "firstName profileImage" },
          { path: "service", select: "name" },
        ],
      })
      .sort("-assignedAt");
    return pendingAssignments;
  } catch (e) {
    throw e;
  }
};

// export const getWorkerBookings = async (userId, status) => {
//   try {
//     const workerProfile = await WorkerProfile.findOne({ user: userId });
//
//     if (!workerProfile) {
//       throw new Error("This user does not have a worker profile");
//     }
//     const query = { worker: workerProfile._id };
//
//     if (status) {
//       query.status = status;
//     } else {
//       query.status = { $in: ["accepted", "in-progress", "completed"] };
//     }
//     const Bookings = await Booking.find(query)
//       .populate("user", "firstName lastName phone profileImage")
//       .populate("service", "name")
//       .sort("-scheduledDate");
//
//     return Bookings;
//   } catch (e) {
//     throw e;
//   }
// };

export const getWorkerReviews = async (userId) => {
  try {
    const workerProfile = await WorkerProfile.findOne({ user: userId });

    if (!workerProfile) {
      throw new Error("This user does not have a worker profile");
    }
    const reviews = await Review.find({ worker: workerProfile._id })
      .populate("user", "firstName lastName email profileImage")
      .sort("-createdAt");

    return reviews;
  } catch (e) {
    throw e;
  }
};

export const updateWorkerAvailability = async (userId, availability) => {
  try {
    const workerProfile = await WorkerProfile.findOne({ user: userId })
      .select("availabilityStatus availability")
      .populate("user", "firstName email phone");

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }
    if (availability) workerProfile.availability = availability;

    await workerProfile.save();

    return workerProfile;
  } catch (e) {
    throw e;
  }
};

export const deleteworker = async (userId) => {
  try {
    const deletedProfile = await WorkerProfile.findOneAndDelete({
      user: userId,
    });
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedProfile || !deletedUser) {
      throw new Error("No worker profile found.");
    }

    return deletedUser;
  } catch (e) {
    throw e;
  }
};

export const markBookingComplete = async (id, userId) => {
  try {
    session.startTransaction();

    const worker = await fetchWorkerById(userId);

    const booking = await Booking.findById({ _id: id, worker: worker._id })
      .populate("service", "name")
      .populate("user", "firstName lastName")
      .session(session);

    if (!booking) throw new NotFoundError("Booking");

    if (!["accepted", "in-progress"].includes(booking.status))
      throw new AppError(
        `Cannot complete a booking with status "${booking.status}"`,
        400,
      );

    booking.status = "completed";
    booking.timeline.push({
      status: "completed",
      timestamp: new Date(),
      note: `Marked as completed by worker`,
    });
    await booking.save();

    await WorkerProfile.findOneAndUpdate(
      { user: booking.worker?.user || booking.worker },
      { $inc: { completedJobs: 1 } },
      { session },
    );

    await session.commitTransaction();

    await Promise.allSettled([
      onBookingCompleted(booking),

      await notifyBookingCompleted(booking.user._id, {
        title: "Service Completed",
        metadata: {
          booking_id: booking._id.toString(),
          service_name: booking.service.name,
          fair: booking.totalAmount,
          customer_name: `${booking.user.firstName} ${booking.user.lastName}`,
        },
        messageData: { serviceName: booking.service.name },
      }),
    ]);

    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};

//-------------------------------------

export const fetchAllWorkers = async (filters) => {
  try {
    const { page = 1, limit = 10, category, status, name, id } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (id) query._id = id;
    if (status) query.approvalStatus = status.trim();

    if (category) {
      const categoryId = await getCategoryIdByName(category);
      if (categoryId === "NOT_FOUND") {
        return {
          workers: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
        };
      }
      query.categories = categoryId;
    }

    if (name) {
      const userIds = await getUserIdsByName(name);
      query.user = { $in: userIds };
    }

    const [workers, total] = await Promise.all([
      WorkerProfile.find(query)
        .select(" approvalStatus ratingAverage ")
        .populate("user", "firstName lastName email profileImage")
        .populate({ path: "categories", select: "name" })
        .limit(parseInt(limit))
        .skip(skip)
        .sort("-ratingAverage"),
      WorkerProfile.countDocuments(query),
    ]);

    return {
      workers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (error) {
    throw error;
  }
};

export const fetchWorkerById = async (id) => {
  try {
    const workerProfile = await WorkerProfile.findOne({
      $or: [{ _id: id }, { user: id }],
    })
      .select(
        " city nationalIdFront nationalIdBack availability approvalStatus completedJobs ratingAverage availability isAvailable createdAt",
      )
      .populate(
        "user",
        "firstName lastName email phone profileImage address isBlocked",
      )
      .populate("categories", "name");

    const { bookings } = await fetchBookings({}, workerProfile.user);

    let bookingData = bookings.map((b) => ({
      status: b.status,
      price: b.totalAmount,
      userName: `${b.user.firstName} ${b.user.lastName}`,
      service: b.service.name,
      scheduledDate: b.scheduledDate,
    }));

    if (!workerProfile) {
      throw new Error("No worker profile found.");
    }

    // if (workerProfile.user && workerProfile.user.isBlocked) {
    //     throw new Error('This worker account is currently suspended.');
    // }

    return { workerProfile, bookingData };
  } catch (e) {
    throw e;
  }
};

export const editWorkerData = async (workerId, clientInfo, workerInfo) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const workerProfile = await editWorkerProfile(
      workerId,
      workerInfo,
      session,
    );

    const user = await editUserData(workerProfile.user, clientInfo, session);

    await session.commitTransaction();

    return { user, workerProfile };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};

const editUserData = async (userId, clientInfo = {}, session) => {
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new NotFoundError("User");

    // ── Phone ────────────────────────────────────────────────────────
    if (clientInfo.phone) {
      const normalizedPhone = normalizePhone(clientInfo.phone);
      const existingPhone = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: userId },
      }).session(session);
      if (existingPhone) throw new AppError("Phone number already in use", 409);
      user.phone = normalizedPhone;
    }

    if (clientInfo.email) {
      const existingEmail = await User.findOne({
        email: clientInfo.email.toLowerCase(),
        _id: { $ne: userId },
      }).session(session);
      if (existingEmail) throw new AppError("Email already in use", 409);
      user.email = clientInfo.email.toLowerCase();
    }

    if (clientInfo.lastName) user.lastName = clientInfo.lastName;
    if (clientInfo.firstName) {
      console.log("Updating firstName to:", clientInfo.firstName);
      user.firstName = clientInfo.firstName;
    }

    // أضيفي هذا للتأكد قبل الحفظ
    console.log("Is modified:", user.isModified());
    await user.save({ session });

    return user;
  } catch (e) {
    throw e;
  }
};

const editWorkerProfile = async (workerId, workerInfo = {}, session) => {
  try {
    const profile = await WorkerProfile.findById(workerId).session(session);
    if (!profile) throw new NotFoundError("Worker profile");

    if (workerInfo.city) profile.city = workerInfo.city;

    if (workerInfo.approvalStatus) {
      profile.approvalStatus = workerInfo.approvalStatus;
      profile.isApproved = workerInfo.approvalStatus === "approved";
    }

    if (workerInfo.availability?.length) {
      for (const slot of workerInfo.availability) {
        if (!validDays.includes(slot.day))
          throw new AppError(`Invalid day: ${slot.day}`, 400);
        if (!timeRegex.test(slot.from) || !timeRegex.test(slot.to))
          throw new AppError(
            `Invalid time format for ${slot.day} — use HH:MM`,
            400,
          );
      }

      // merge — بنحدث الـ days الموجودة ونضيف الجديدة
      for (const incoming of workerInfo.availability) {
        const existing = profile.availability.find(
          (a) => a.day === incoming.day,
        );
        if (existing) {
          existing.from = incoming.from;
          existing.to = incoming.to;
          existing.isAvailable = incoming.isAvailable ?? existing.isAvailable;
        } else {
          profile.availability.push(incoming);
        }
      }
    }

    if (workerInfo.memberSince) profile.memberSince = workerInfo.memberSince;
    if (workerInfo.categories) profile.categories = workerInfo.categories;

    await profile.save({ session });

    return profile;
  } catch (e) {
    throw e;
  }
};
