import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatRoom from "../modules/chats/ChatRoom.model.js";
import * as trackingService from "../modules/Tracking system/tracking.service.js";
import Booking from "../modules/bookings/Booking.model.js";

let io;
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "*", credentials: true },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.token ||
      socket.handshake.query?.token;

    if (!token) return next(new Error("No token provided"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.role = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // ── Online tracking ──────────────────────────────────────────
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    console.log(`🔌 Connected: ${socket.userId} (${socket.role})`);
    console.log(`👥 Online users: ${onlineUsers.size}`);

    socket.join(`user:${socket.userId}`);

    // ── Room join ────────────────────────────────────────────────
    socket.on("room:join", async ({ roomId }) => {
      try {
        if (!roomId) return;
        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isParticipant(socket.userId)) return;
        socket.join(`room:${roomId}`);
        socket.emit("room:joined", { roomId });
        console.log(`[Socket] ${socket.userId} joined room:${roomId}`);
      } catch (err) {
        console.error("[Socket] room:join error:", err.message);
      }
    });

    // ── Room leave ───────────────────────────────────────────────
    socket.on("room:leave", ({ roomId }) => {
      socket.leave(`room:${roomId}`);
    });

    // ── Typing ───────────────────────────────────────────────────
    socket.on("typing:start", ({ roomId }) => {
      socket.to(`room:${roomId}`).emit("typing:start", {
        roomId,
        userId: socket.userId,
      });
    });

    socket.on("typing:stop", ({ roomId }) => {
      socket.to(`room:${roomId}`).emit("typing:stop", {
        roomId,
        userId: socket.userId,
      });
    });

    // ── Mark as read ─────────────────────────────────────────────
    socket.on("messages:read", async ({ roomId }) => {
      try {
        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isParticipant(socket.userId)) return;
        room.resetUnread(socket.userId);
        await room.save();
        socket.to(`room:${roomId}`).emit("messages:read", {
          roomId,
          userId: socket.userId,
        });
      } catch (err) {
        console.error("[Socket] messages:read error:", err.message);
      }
    });

    // ── Disconnect ───────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      const sockets = onlineUsers.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(socket.userId);
      }
      console.log(` Disconnected: ${socket.userId} — ${reason}`);
      console.log(` Online users: ${onlineUsers.size}`);
    });

    socket.on("worker:update_location", async ({ longitude, latitude }) => {
      try {
        if (socket.role !== "worker") return;
        await trackingService.updateWorkerLocation(socket.userId, {
          longitude: Number(longitude),
          latitude: Number(latitude),
        });
      } catch (err) {
        console.error("[Socket] worker:update_location error:", err.message);
      }
    });

    socket.on("tracking:subscribe", async ({ workerId }) => {
      try {
        const booking = await Booking.findOne({
          user: socket.userId,
          worker: workerId,
          status: { $in: ["accepted", "in_progress"] },
        });
        if (!booking) return;
        socket.join(`tracking:${workerId}`);
      } catch (err) {
        console.error("[Socket] tracking:subscribe error:", err.message);
      }
    });

    socket.on("tracking:unsubscribe", ({ workerId }) => {
      socket.leave(`tracking:${workerId}`);
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized — call initSocket first");
  return io;
};

export const isUserOnline = (userId) => onlineUsers.has(userId.toString());

export const emitToUser = (userId, event, data) => {
  try {
    getIO().to(`user:${userId.toString()}`).emit(event, data);
  } catch (err) {
    console.warn(`[Socket] emitToUser failed for ${userId}:`, err.message);
  }
};

export const emitToRoom = (roomId, event, data) => {
  try {
    getIO().to(`room:${roomId.toString()}`).emit(event, data);
  } catch (err) {
    console.warn(`[Socket] emitToRoom failed for ${roomId}:`, err.message);
  }
};
