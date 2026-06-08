import SupportTicket from "./SupportTicket.model.js";
import { getOrCreateSupportRoom } from "../chats/chatRoom.service.js";
import {
  NotFoundError,
  ForbiddenError,
  AppError,
} from "../../core/utils/Errors.js";
import ChatRoom from "../chats/ChatRoom.model.js";
import mongoose from "mongoose";

// ─── Create ticket + auto-open support room ───────────────────────────────────
export const createTicket = async (
  userId,
  { subject, description, priority, attachments },
) => {
  const ticket = await SupportTicket.create({
    user: userId,
    subject,
    description,
    priority: priority || "medium",
    attachments: attachments || [],
  });

  const room = await getOrCreateSupportRoom(userId, ticket._id);
  ticket.chatRoom = room._id;
  await ticket.save();

  return { ticket, room };
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
