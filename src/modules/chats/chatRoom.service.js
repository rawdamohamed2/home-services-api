import mongoose from "mongoose";
import ChatRoom from "./ChatRoom.model.js";
import {
  NotFoundError,
  ForbiddenError,
  AppError,
} from "../../core/utils/Errors.js";

const populateRoom = (query) =>
  query
    .populate("participants", "firstName lastName profileImage role")
    .populate("lastMessage", "message messageType createdAt senderType")
    .populate("supportTicket", "subject status priority");

// ─── Get all rooms for a user ─────────────────────────────────────────────────
export const getUserRooms = async (userId) => {
  try {
    const rooms = await populateRoom(
      ChatRoom.find({ participants: userId }).sort("-lastMessageAt"),
    );
    return rooms.map((r) => ({
      ...r.toJSON(),
      unreadCount: r.unreadCount.get(userId.toString()) || 0,
    }));
  } catch (e) {
    throw e;
  }
};

// ─── Get single room (verify participant) ─────────────────────────────────────
export const getRoomById = async (roomId, userId) => {
  try {
    const room = await populateRoom(ChatRoom.findById(roomId));
    if (!room) throw new NotFoundError("Chat room");
    if (!room.isParticipant(userId)) throw new ForbiddenError();
    return room;
  } catch (e) {
    throw e;
  }
};

// ─── Get or create bot room ───────────────────────────────────────────────────
export const getOrCreateBotRoom = async (userId) => {
  try {
    let room = await ChatRoom.findOne({
      type: "user_bot",
      participants: userId,
    });
    if (!room) room = await ChatRoom.createBotRoom(userId);
    return populateRoom(ChatRoom.findById(room._id));
  } catch (e) {
    throw e;
  }
};

// ─── Get or create support room ───────────────────────────────────────────────
export const getOrCreateSupportRoom = async (userId, ticketId = null) => {
  try {
    let room = await ChatRoom.findOne({
      type: "support",
      participants: userId,
      status: "active",
    });
    if (room) return populateRoom(ChatRoom.findById(room._id));

    const rolesWithPermission = await mongoose
      .model("RolePermission")
      .find({ permissions: "manage_ChatAndReviews" })
      .select("role")
      .lean();

    if (!rolesWithPermission.length)
      throw new AppError("No support roles configured", 503);

    const allowedRoles = rolesWithPermission.map((r) => r.role);

    if (!room) {
      const agent = await mongoose
        .model("User")
        .findOne({
          role: { $in: allowedRoles },
          isBlocked: false,
        })
        .select("_id role")
        .lean();

      if (!agent) throw new AppError("No support agent available", 503);

      room = await ChatRoom.create({
        participants: [userId, agent._id],
        type: "support",
        status: "active",
        ...(ticketId && { supportTicket: ticketId }),
      });
    }

    return populateRoom(ChatRoom.findById(room._id));
  } catch (e) {
    throw e;
  }
};

// ─── Create room for booking (user ↔ worker) ──────────────────────────────────
export const createBookingRoom = async (bookingId, userId, workerId) => {
  try {
    const existing = await ChatRoom.findOne({ booking: bookingId });
    if (existing) return populateRoom(ChatRoom.findById(existing._id));

    const room = await ChatRoom.createForBooking(bookingId, userId, workerId);
    return populateRoom(ChatRoom.findById(room._id));
  } catch (e) {
    throw e;
  }
};

// ─── Mark room as read ────────────────────────────────────────────────────────
export const markRoomRead = async (roomId, userId) => {
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new NotFoundError("Chat room");
    if (!room.isParticipant(userId)) throw new ForbiddenError();
    room.resetUnread(userId);
    await room.save();
    return room;
  } catch (e) {
    throw e;
  }
};

// ─── Close a room ─────────────────────────────────────────────────────────────
export const closeRoom = async (roomId) => {
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new NotFoundError("Chat room");
    room.status = "closed";
    await room.save();
    return room;
  } catch (e) {
    throw e;
  }
};
