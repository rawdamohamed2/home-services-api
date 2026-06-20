import SupportTicket from "./SupportTicket.model.js";
import { getOrCreateSupportRoom } from "../chats/chatRoom.service.js";
import {
  NotFoundError,
  ForbiddenError,
  AppError,
} from "../../core/utils/Errors.js";
import ChatRoom from "../chats/ChatRoom.model.js";
import mongoose from "mongoose";
import User from "../users/user.model.js";

export const getAvailableAdmins = async () => {
  const rolesWithPermission = await mongoose
    .model("RolePermission")
    .find({ permissions: "manage_ChatAndReviews" })
    .select("role")
    .lean();

  if (!rolesWithPermission.length)
    throw new AppError("No support roles configured", 503);

  const allowedRoles = rolesWithPermission.map((r) => r.role);

  const availableAdmins = await mongoose
    .model("User")
    .find({
      role: { $in: allowedRoles },
      isBlocked: false,
    })
    .select("_id")
    .lean();

  if (!availableAdmins.length)
    throw new AppError("No support agent available", 503);

  return availableAdmins;
};

// ─── Create ticket + auto-open support room ───────────────────────────────────
export const createTicket = async (
  userId,
  { subject = "Customer issue", description = "", priority, attachments },
) => {
  try {
    const existingTicket = await SupportTicket.findOne({
      user: userId,
      status: { $in: ["open", "in_progress"] },
    }).lean();

    if (existingTicket) {
      console.log("User already has an active ticket. Returning existing one.");

      let room = await getOrCreateSupportRoom(userId, existingTicket._id);

      if (room && typeof room.toObject === "function") {
        room = room.toObject();
      }

      return { ticket: existingTicket, room };
    }

    const availableAdmins = await getAvailableAdmins();
    let assignedAdminId = null;

    if (availableAdmins.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableAdmins.length);
      assignedAdminId = availableAdmins[randomIndex]._id;
    }

    const ticket = await SupportTicket.create({
      user: userId,
      subject: subject,
      description: description,
      priority: priority || "medium",
      assignedTo: assignedAdminId,
      attachments: attachments || [],
      status: assignedAdminId ? "in_progress" : "open",
    });

    const room = await getOrCreateSupportRoom(
      userId,
      ticket._id,
      assignedAdminId,
    );

    ticket.chatRoom = room._id;
    await ticket.save();

    return { ticket, room };
  } catch (e) {
    throw e;
  }
};

// ─── Get user's tickets ───────────────────────────────────────────────────────
export const getUserTickets = async (userId, { status } = {}) => {
  const filter = { user: userId };
  if (status) filter.status = status;

  return SupportTicket.find(filter)
    .populate("assignedTo", "firstName lastName profileImage")
    .populate({
      path: "chatRoom",
      select: "type status lastMessage",
      populate: {
        path: "participants",
        select: "firstName lastName profileImage role",
      },
    })
    .sort("-createdAt");
};

// ─── Get single ticket ────────────────────────────────────────────────────────
export const getTicketById = async (ticketId, userId, role) => {
  try {
    const ticket = await SupportTicket.findById(ticketId)
      .populate("user", "firstName lastName email profileImage")
      .populate("assignedTo", "firstName lastName profileImage")
      .populate({
        path: "chatRoom",
        select: "type status lastMessage",
        populate: {
          path: "participants",
          select: "firstName lastName profileImage role",
        },
      });

    if (!ticket) throw new NotFoundError("Ticket");

    if (role === "user" && ticket.user._id.toString() !== userId.toString())
      throw new ForbiddenError();

    return ticket;
  } catch (error) {
    throw new Error(error.message);
  }
};

// ─── Admin: get all open tickets ──────────────────────────────────────────────
export const getOpenTickets = async () => SupportTicket.getOpenTickets();

// ─── Admin: assign ────────────────────────────────────────────────────────────
export const assignTicket = async (ticketId, adminId) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new NotFoundError("Ticket");
  return ticket.assignTo(adminId);
};

// ─── Admin: resolve ───────────────────────────────────────────────────────────
export const resolveTicket = async (ticketId) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new NotFoundError("Ticket");
  return ticket.resolve();
};

// ─── Admin: close ─────────────────────────────────────────────────────────────
export const closeTicket = async (ticketId, reason, adminId) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new NotFoundError("Ticket");
  return ticket.close(reason, adminId);
};

// ─── User: rate resolved ticket ───────────────────────────────────────────────
export const rateTicket = async (ticketId, userId, rating) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new NotFoundError("Ticket");
  if (ticket.user.toString() !== userId.toString()) throw new ForbiddenError();
  if (ticket.status !== "resolved")
    throw new AppError("Can only rate resolved tickets", 400);

  ticket.userRating = rating;
  return ticket.save();
};

// ─── Admin: add internal note ─────────────────────────────────────────────────
export const addAdminNote = async (ticketId, note) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new NotFoundError("Ticket");
  return ticket.addNote(note);
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getStats = async () => SupportTicket.getStats();
