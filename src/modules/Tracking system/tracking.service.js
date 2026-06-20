import User from "../users/user.model.js";
import WorkerProfile from "../workers/WorkerProfile.model.js";
import Booking from "../bookings/Booking.model.js";
import { emitToUser, emitToRoom } from "../../socket/socket.js";
import {
  NotFoundError,
  ForbiddenError,
  AppError,
} from "../../core/utils/Errors.js";
import { getWorkerUserId } from "../workers/worker.service.js";

// ─── Worker يبعت location update ─────────────────────────────────────────────
export const updateWorkerLocation = async (userId, { longitude, latitude }) => {
  try {
    if (!longitude || !latitude)
      throw new AppError("longitude and latitude are required", 400);

    if (longitude < -180 || longitude > 180)
      throw new AppError("Invalid longitude", 400);
    if (latitude < -90 || latitude > 90)
      throw new AppError("Invalid latitude", 400);

    // تعريف الوقت مرة واحدة لتوحيده في كل التحديثات
    const now = new Date();

    // 1. تحديث موقع العامل في User model
    const user = await User.findByIdAndUpdate(
      userId,
      {
        enabledLocation: true,
        "location.type": "Point",
        "location.coordinates": [longitude, latitude],
      },
      { new: true, runValidators: false },
    ).select("firstName lastName location");

    if (!user) throw new NotFoundError("Worker");

    // 2. تحديث وقت آخر ظهور في WorkerProfile
    const worker = await WorkerProfile.findOneAndUpdate(
      { user: userId },
      { lastLocationUpdate: now },
    );

    // 3. الإرسال للمشتركين في غرفة التتبع (Users looking at the map)
    emitToRoom(`tracking:${userId}`, "worker:location", {
      userId,
      workerName: `${user.firstName} ${user.lastName}`,
      location: {
        longitude,
        latitude,
        updatedAt: now, // تم حل المشكلة هنا
      },
    });

    const activeBookings = await Booking.find({
      worker: worker._id,
      status: { $in: ["accepted", "in_progress"] },
    })
      .select("chatRoom")
      .lean();
    console.log(activeBookings);
    for (const booking of activeBookings) {
      if (booking.chatRoom) {
        emitToRoom(booking.chatRoom, "worker:location", {
          userId,
          location: { longitude, latitude, updatedAt: now },
        });
      }
    }

    return {
      location: { longitude, latitude },
      notifiedRooms: activeBookings.length,
    };
  } catch (e) {
    throw e;
  }
};

export const updateAvailabilityStatus = async (workerId, status) => {
  try {
    const allowed = ["online", "offline", "busy"];
    if (!allowed.includes(status))
      throw new AppError(`Status must be one of: ${allowed.join(", ")}`, 400);

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: workerId },
      { availabilityStatus: status },
      { new: true },
    ).select("availabilityStatus lastLocationUpdate");

    if (!profile) throw new NotFoundError("Worker profile");

    return profile;
  } catch (e) {
    throw e;
  }
};
// ─── User يجيب location الـ worker ───────────────────────────────────────────
export const getWorkerLocation = async (userId, workerId) => {
  // تحقق إن في booking active بين الاتنين
  try {
    const booking = await Booking.findOne({
      user: userId,
      worker: workerId,
      status: { $in: ["accepted", "in_progress"] },
    });
    if (!booking)
      throw new ForbiddenError("No active booking with this worker");

    const workerUserId = await getWorkerUserId(workerId);
    const worker = await User.findById(workerUserId)
      .select("firstName lastName location enabledLocation")
      .lean();

    if (!worker) throw new NotFoundError("Worker");
    if (!worker.enabledLocation || !worker.location?.coordinates?.length)
      throw new AppError("Worker location not available", 404);

    const profile = await WorkerProfile.findOne({ user: workerId })
      .select("lastLocationUpdate availabilityStatus")
      .lean();

    return {
      workerId,
      workerName: `${worker.firstName} ${worker.lastName}`,
      location: {
        longitude: worker.location.coordinates[0],
        latitude: worker.location.coordinates[1],
        updatedAt: profile?.lastLocationUpdate || null,
      },
      availabilityStatus: profile?.availabilityStatus || "offline",
      bookingId: booking._id,
    };
  } catch (e) {
    throw e;
  }
};

// ─── Worker يوقف مشاركة الـ location ─────────────────────────────────────────
export const disableWorkerLocation = async (workerId) => {
  try {
    await User.findByIdAndUpdate(workerId, {
      enabledLocation: false,
      "location.coordinates": [],
    });

    await WorkerProfile.findOneAndUpdate(
      { user: workerId },
      { availabilityStatus: "offline" },
    );

    return { message: "Location sharing disabled" };
  } catch (e) {
    throw e;
  }
};
