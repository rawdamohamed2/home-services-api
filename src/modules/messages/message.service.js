import Message from "./Message.model.js";
import ChatRoom from "../chats/ChatRoom.model.js";
import {
  NotFoundError,
  ForbiddenError,
  AppError,
} from "../../core/utils/Errors.js";

const BOT_ID = "000000000000000000000001";
const AI_API_URL = "https://servigo-ai-api-production-7877.up.railway.app/chat";

// ─── Get paginated messages ───────────────────────────────────────────────────
export const getRoomMessages = async (
  roomId,
  userId,
  { page = 1, limit = 50 } = {},
) => {
  const room = await ChatRoom.findById(roomId);
  if (!room) throw new NotFoundError("Chat room");
  if (!room.isParticipant(userId)) throw new ForbiddenError();

  const skip = (Number(page) - 1) * Number(limit);

  const [messages, total] = await Promise.all([
    Message.find({ chatRoom: roomId, isDeleted: false })
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
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
      .populate("readBy.user", "firstName lastName profileImage"),

    Message.countDocuments({ chatRoom: roomId, isDeleted: false }),
  ]);
  return {
    messages: messages.reverse(),
    total,
    page: Number(page),
    limit: Number(limit),
  };
};

// ─── Create message ───────────────────────────────────────────────────────────
export const createMessage = async (roomId, sender, payload) => {
  const {
    message,
    messageType = "text",
    replyTo = null,
    attachments = [],
  } = payload;

  const room = await ChatRoom.findById(roomId).populate(
    "participants",
    "firstName lastName fcmToken role",
  );
  if (!room) throw new NotFoundError("Chat room");
  if (!room.isParticipant(sender._id)) throw new ForbiddenError();
  if (room.status === "closed") throw new AppError("This chat is closed", 400);

  const senderTypeMap = {
    worker: "worker",
    admin: "admin",
    support: "support",
  };
  const senderType = senderTypeMap[sender.role] || "user";

  const newMsg = await Message.create({
    chatRoom: roomId,
    sender: sender._id,
    senderType,
    message,
    messageType,
    ...(replyTo && { replyTo }),
    attachments,
  });

  await newMsg.populate("sender", "firstName lastName profileImage role");
  if (replyTo)
    await newMsg.populate({
      path: "replyTo",
      select: "message messageType sender senderType attachments",
      populate: {
        path: "sender",
        select: "firstName lastName profileImage role",
      },
    });

  return { message: newMsg, room };
};

// ─── Soft-delete a message ────────────────────────────────────────────────────
export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new NotFoundError("Message");
  if (message.sender.toString() !== userId.toString())
    throw new ForbiddenError("Not authorized to delete this message");

  message.isDeleted = true;
  await message.save();
  return message;
};

// ─── Add / update reaction ────────────────────────────────────────────────────
export const addReaction = async (messageId, userId, reaction) => {
  const message = await Message.findById(messageId);
  if (!message) throw new NotFoundError("Message");
  return message.addReaction(userId, reaction);
};

// ─── Bot reply ────────────────────────────────────────────────────────────────
export const generateBotReply = async (room, userMessage) => {
  // Build conversation history
  const history = await Message.find({ chatRoom: room._id, isDeleted: false })
    .sort("-createdAt")
    .limit(12)
    .lean();

  const formattedHistory = history.reverse().map((m) => ({
    role: m.sender.toString() === BOT_ID ? "assistant" : "user",
    content: m.message,
  }));

  // Build live context from DB
  const contextData = await _buildBotContext();

  let botReply = null;
  let quickReplies = [];

  try {
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        workers: contextData.workers,
        categories: contextData.categories,
        services: contextData.services,
        history: formattedHistory.slice(-6),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      botReply =
        data.reply || data.message || data.response || data.text || null;
      quickReplies = data.quickReplies || [];
    }
  } catch (err) {
    console.error("[Bot] AI API error:", err.message);
  }

  // Fallback if API failed
  if (!botReply) {
    const fallback = _fallbackBotReply(userMessage, contextData);
    botReply = fallback.text;
    quickReplies = fallback.quickReplies;
  }

  const botMessage = await Message.create({
    chatRoom: room._id,
    sender: BOT_ID,
    senderType: "bot",
    message: botReply,
    messageType: "text",
    quickReplies: quickReplies.map((qr) => ({ title: qr, payload: qr })),
  });

  return botMessage;
};

// ─── Build context from DB matching the AI API schema ────────────────────────
async function _buildBotContext() {
  try {
    const User = (await import("../models/User.js")).default;
    const Service = (await import("../models/Service.js")).default;

    const [workers, services] = await Promise.all([
      User.find({ role: "worker", isActive: true })
        .select("fullName category")
        .limit(50)
        .lean(),
      Service.find({ isActive: true }).select("name category").limit(50).lean(),
    ]);

    const categories = [
      ...new Set(workers.map((w) => w.category).filter(Boolean)),
    ];

    return {
      workers: workers.map((w) => ({ name: w.fullName, category: w.category })),
      categories,
      services: services.map((s) => ({ name: s.name, category: s.category })),
    };
  } catch {
    // Fallback static data if models don't exist yet
    return {
      workers: [],
      categories: [],
      services: [],
    };
  }
}

// ─── Fallback reply when AI API is down ──────────────────────────────────────
function _fallbackBotReply(msg, context) {
  const m = msg.toLowerCase();

  const workerByCategory = (cat) =>
    context.workers.find((w) => w.category === cat);

  if (m.includes("plumb") || m.includes("pipe") || m.includes("water")) {
    const w = workerByCategory("plumber");
    return {
      text: w
        ? `I found ${w.name}, an experienced plumber available near you!`
        : "I can help you find a plumber. What's the issue?",
      quickReplies: ["Book now", "See all plumbers", "Get a quote"],
    };
  }

  if (m.includes("electric") || m.includes("wiring") || m.includes("power")) {
    const w = workerByCategory("electrician");
    return {
      text: w
        ? `${w.name} is our top electrician, available today!`
        : "We have electricians available. What type of work do you need?",
      quickReplies: ["Book now", "See all electricians", "Get a quote"],
    };
  }

  if (m.includes("carpen") || m.includes("furniture") || m.includes("wood")) {
    const w = workerByCategory("carpenter");
    return {
      text: w
        ? `${w.name} is available for carpentry work!`
        : "We have carpenters available. What do you need done?",
      quickReplies: ["Book now", "See all carpenters", "Get a quote"],
    };
  }

  if (m.includes("book") || m.includes("hire") || m.includes("schedule")) {
    return {
      text: "I can help you book a service right away. What category do you need?",
      quickReplies: context.categories.length
        ? context.categories.slice(0, 4)
        : ["Plumbing", "Electrical", "Carpentry"],
    };
  }

  if (m.includes("price") || m.includes("cost") || m.includes("how much")) {
    return {
      text: "Pricing depends on the job type and worker. You can request a free quote before confirming.",
      quickReplies: ["Request a quote", "Browse services", "Book a worker"],
    };
  }

  return {
    text: "Hi! I'm the Servigo assistant. I can help you find workers, browse services, and manage bookings.",
    quickReplies: context.categories.length
      ? context.categories.slice(0, 3)
      : ["Find a worker", "My bookings", "Contact support"],
  };
}
