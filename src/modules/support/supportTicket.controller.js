import * as ticketService from "./supportTicket.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import { emitToUser } from "../../socket/socket.js";
import {
  notifyTicketAssigned,
  notifyTicketClosed,
  notifyTicketResolved,
} from "../notifications/Notification.service.js";

// ─── User ─────────────────────────────────────────────────────────────────────

export const createTicket = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = req.body;
    const { ticket, room } = await ticketService.createTicket(userId, data);
    return ApiResponse.success(
      res,
      { ticket, room },
      "Ticket created and support room opened",
      201,
    );
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.handleMongooseError(res, err);
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = req.query;
    const tickets = await ticketService.getUserTickets(userId, data);
    return ApiResponse.success(res, tickets, "Tickets fetched");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const getTicket = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const id = req.params.id;
    const ticket = await ticketService.getTicketById(id, userId, userRole);
    return ApiResponse.success(res, ticket);
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const rateTicket = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    const { rating } = req.body;
    const ticket = await ticketService.rateTicket(id, userId, rating);
    return ApiResponse.success(res, ticket, "Rating submitted");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllOpenTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getOpenTickets();
    return ApiResponse.success(res, tickets, "Open tickets fetched");
  } catch (err) {
    return ApiResponse.serverError(res);
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await ticketService.getStats();
    return ApiResponse.success(res, stats, "Stats fetched");
  } catch (err) {
    return ApiResponse.serverError(res);
  }
};

export const assignTicket = async (req, res) => {
  try {
    const id = req.params.id;
    const { adminId } = req.body;
    const ticket = await ticketService.assignTicket(id, adminId);
    await notifyTicketAssigned(
      adminId,
      { ticketId: ticket._id.toString() },
      {
        ticketCode: ticket._id.toString().slice(-6).toUpperCase(),
        subject: ticket.subject,
      },
    );

    return ApiResponse.success(res, ticket, "Ticket assigned");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const id = req.params.id;
    const ticket = await ticketService.resolveTicket(id);
    console.log(ticket);
    await notifyTicketResolved(
      ticket.user,
      { ticketId: ticket._id.toString() },
      { subject: ticket.subject },
    );

    return ApiResponse.success(res, ticket, "Ticket resolved");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const closeTicket = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    const { reason } = req.body;
    const ticket = await ticketService.closeTicket(id, reason, userId);
    await notifyTicketClosed(
      ticket.user,
      { ticketId: ticket._id.toString() },
      { subject: ticket.subject },
    );
    return ApiResponse.success(res, ticket, "Ticket closed");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const addNote = async (req, res) => {
  try {
    const ticket = await ticketService.addAdminNote(
      req.params.id,
      req.body.note,
    );
    return ApiResponse.success(res, ticket, "Note added");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};
