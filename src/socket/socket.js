import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
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
    console.log(`🔌 Connected: ${socket.userId} (${socket.role})`);
    console.log(`👥 Total online: ${io.engine.clientsCount}`);

    socket.join(`user:${socket.userId}`);

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.userId} — reason: ${reason}`);
      console.log(`👥 Total online: ${io.engine.clientsCount}`);
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized — call initSocket first");
  return io;
};

export const emitToUser = (userId, event, data) => {
  try {
    getIO().to(`user:${userId.toString()}`).emit(event, data);
    console.log(`Sending event ${event} to user ${userId} ,hgfghgfh ${data}`);
  } catch (err) {
    console.warn(`[Socket] Could not emit to user ${userId}:`, err.message);
  }
};
