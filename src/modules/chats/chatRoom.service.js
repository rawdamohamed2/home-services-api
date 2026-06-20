import ChatRoom from "./ChatRoom.model.js";
import { NotFoundError, ForbiddenError } from "../../core/utils/Errors.js";
import Message from "../messages/Message.model.js";
import { getAvailableAdmins } from "../support/supportTicket.service.js";

const populateRoom = (query) =>
  query
    .populate("participants", "firstName lastName profileImage role")
    .populate("lastMessage", "message messageType createdAt senderType")
    .populate("supportTicket", "subject status priority");

// ─── Get all rooms for a user ─────────────────────────────────────────────────
export const getUserRooms = async (userId) => {
  try {
    const rooms = await populateRoom(
      ChatRoom.find({
        participants: userId,
        type: { $ne: "support" },
        status: "active",
      }).sort("-lastMessageAt"),
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
export const getOrCreateSupportRoom = async (
  userId,
  ticketId = null,
  agentId = null,
) => {
  try {
    let room = await ChatRoom.findOne({
      type: "support",
      participants: userId,
      status: "active",
    });

    if (room) {
      const exitRoom = await populateRoom(ChatRoom.findById(room._id));

      const messages = await Message.find({ chatRoom: exitRoom._id })
        .populate("sender", "firstName lastName profileImage role")
        .populate({
          path: "replyTo",
          select: "message messageType sender senderType attachments",
          populate: {
            path: "sender",
            select: "firstName lastName profileImage role",
          },
        })
        .populate("reactions.user", "firstName lastName profileImage")
        .populate("readBy.user", "firstName lastName profileImage");

      return { room: exitRoom, messages: messages };
    }

    let finalAgentId = agentId;

    if (!finalAgentId) {
      const availableAdmins = await getAvailableAdmins();

      if (availableAdmins.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAdmins.length);
        finalAgentId = availableAdmins[randomIndex]._id;
      }
    }

    room = await ChatRoom.create({
      participants: [userId, finalAgentId],
      type: "support",
      status: "active",
      ...(ticketId && { supportTicket: ticketId }),
    });

    const NewRoom = await populateRoom(ChatRoom.findById(room._id));

    const messages = await Message.find({ chatRoom: NewRoom._id })
      .populate("sender", "firstName lastName profileImage role")
      .populate({
        path: "replyTo",
        select: "message messageType sender senderType attachments",
        populate: {
          path: "sender",
          select: "firstName lastName profileImage role",
        },
      })
      .populate("reactions.user", "firstName lastName profileImage")
      .populate("readBy.user", "firstName lastName profileImage");

    return { room: NewRoom, messages: messages };
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

export const getChatUserWorker = async (userId, bookingId) => {
  try {
    const room = await ChatRoom.findOne({
      type: "user_worker",
      booking: bookingId,
    })
      .populate("participants", "firstName lastName profileImage role")
      .populate("lastMessage", "message messageType createdAt senderType")
      .populate("supportTicket", "subject status priority");

    if (!room) {
      throw new Error("Chat room not found for this booking");
    }

    const messages = await Message.find({ chatRoom: room._id })
      .populate("sender", "firstName lastName profileImage role")
      .populate({
        path: "replyTo",
        select: "message messageType sender senderType attachments",
        populate: {
          path: "sender",
          select: "firstName lastName profileImage role",
        },
      })
      .populate("reactions.user", "firstName lastName profileImage")
      .populate("readBy.user", "firstName lastName profileImage");

    if (messages.length === 0) {
      return { room: room, messages: "no messages found" };
    }

    return { room: room, messages: messages };
  } catch (e) {
    throw e;
  }
};
