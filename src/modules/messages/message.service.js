import Message from "./Message.model.js";
import ChatRoom from "../chats/ChatRoom.model.js";
import {
  NotFoundError,
  ForbiddenError,
  AppError,
} from "../../core/utils/Errors.js";
import Service from "../services/service.model.js";
import WorkerProfile from "../workers/WorkerProfile.model.js";
const BOT_ID = "000000000000000000000001";
const AI_API_URL = "https://servigo-ai-api--marogamil1750.replit.app/chat";

// ─── Get paginated messages ───────────────────────────────────────────────────
export const getRoomMessages = async (
  roomId,
  userId,
  { page = 1, limit = 50 } = {},
) => {
  try {
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
  } catch (e) {
    throw e;
  }
};

// ─── Create message ───────────────────────────────────────────────────────────
export const createMessage = async (roomId, sender, payload) => {
  try {
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
    if (room.status === "closed")
      throw new AppError("This chat is closed", 400);

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
  } catch (e) {
    throw e;
  }
};

// ─── Soft-delete a message ────────────────────────────────────────────────────
export const deleteMessage = async (messageId, userId) => {
  try {
    const message = await Message.findById(messageId);
    if (!message) throw new NotFoundError("Message");
    if (message.sender.toString() !== userId.toString())
      throw new ForbiddenError("Not authorized to delete this message");

    message.isDeleted = true;
    await message.save();
    return message;
  } catch (e) {
    throw e;
  }
};

// ─── Add / update reaction ────────────────────────────────────────────────────
export const addReaction = async (messageId, userId, reaction) => {
  try {
    const message = await Message.findById(messageId);
    if (!message) throw new NotFoundError("Message");
    return message.addReaction(userId, reaction);
  } catch (e) {
    throw e;
  }
};

// ─── Bot reply ────────────────────────────────────────────────────────────────
async function _buildBotContext() {
  try {
    const [workers, services] = await Promise.all([
      WorkerProfile.find()
        .populate("user", "firstName lastName")
        .populate("categories", "name")
        .limit(50)
        .lean(),
      Service.find({ isActive: true })
        .populate("category", "name")
        .select("name category")
        .limit(50)
        .lean(),
    ]);

    const workersFlat = workers.flatMap((w) =>
      (w.categories || []).map((cat) => ({
        name: `${w.user?.firstName || ""} ${w.user?.lastName || ""}`.trim(),
        category: cat.name,
      })),
    );

    const categories = [
      ...new Set(workersFlat.map((w) => w.category).filter(Boolean)),
    ];

    return {
      workers: workersFlat,
      categories,
      services: services
        .filter((s) => s.category?.name)
        .map((s) => ({ name: s.name, category: s.category.name })),
    };
  } catch (err) {
    throw err;
  }
}

async function _callBotAPI(userMessage, contextData, history) {
  try {
    console.log(" _callBotAPI ", contextData);
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        workers: contextData.workers,
        categories: contextData.categories,
        services: contextData.services,
      }),
    });

    if (!response.ok) {
      console.warn("[Bot] API returned status:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("[Bot] API response:", JSON.stringify(data));
    console.log(data);
    return data;
  } catch (err) {
    console.error("[Bot] API error:", err.message);
    return null;
  }
}

export const generateBotReply = async (room, userMessage) => {
  try {
    // 1. Conversation history
    const history = await Message.find({ chatRoom: room._id, isDeleted: false })
      .sort("-createdAt")
      .limit(12)
      .lean();

    const formattedHistory = history.reverse().map((m) => ({
      role: m.sender.toString() === BOT_ID ? "assistant" : "user",
      content: m.message,
    }));

    // 2. Context من الـ DB
    const contextData = await _buildBotContext();

    // 3. Call API
    const apiResult = await _callBotAPI(
      userMessage,
      contextData,
      formattedHistory,
    );
    console.log(apiResult);
    // 4. بناء الـ reply وال quickReplies
    const { replyText, quickReplies } = _buildReply(
      apiResult,
      userMessage,
      contextData,
    );

    // 5. حفظ رسالة البوت
    const botMessage = await Message.create({
      chatRoom: room._id,
      sender: BOT_ID,
      senderType: "bot",
      message: replyText,
      messageType: "text",
      quickReplies: quickReplies.map((qr) => ({ title: qr, payload: qr })),
    });

    return botMessage;
  } catch (e) {
    throw e;
  }
};

// ─── Build context from DB matching the AI API schema ────────────────────────

function _buildReply(apiResult, userMessage, contextData) {
  // حالة 1: API رجع reply نصي حقيقي من Botpress
  if (apiResult?.reply && apiResult.reply.trim().length > 0) {
    const quickReplies = _getQuickRepliesFromWorkers(apiResult.matched_workers);
    return { replyText: apiResult.reply.trim(), quickReplies };
  }

  // حالة 2: API شغال ولقى workers (reply فاضي لأن Botpress مش configured)
  if (apiResult?.found && apiResult?.matched_workers?.length > 0) {
    return _buildWorkersFoundReply(apiResult.matched_workers);
  }

  // حالة 3: API شغال بس مالقاش حاجة
  if (apiResult && apiResult.found === false) {
    return _buildNotFoundReply(userMessage, contextData);
  }

  // حالة 4: API فشل تماماً → fallback محلي
  return _fallbackReply(userMessage, contextData);
}

// ─── لما يلاقي workers ────────────────────────────────────────────────────────
function _buildWorkersFoundReply(matchedWorkers) {
  if (matchedWorkers.length === 1) {
    const w = matchedWorkers[0];
    const categoryAr = _categoryAr(w.category);
    return {
      replyText: `وجدت ${w.name}، ${categoryAr} متاح قريب منك! 🔧\nاضغط أدناه لحجزه أو رؤية تفاصيله.`,
      quickReplies: [`احجز ${w.name}`, "عرض التفاصيل", "عمال آخرين"],
    };
  }

  const names = matchedWorkers.map((w) => w.name).join(" و ");
  const cat = _categoryAr(matchedWorkers[0].category);
  return {
    replyText: `وجدت ${matchedWorkers.length} ${cat} متاحين: ${names} 👷\nاختر من تريد:`,
    quickReplies: matchedWorkers
      .map((w) => `احجز ${w.name}`)
      .concat("عمال آخرين"),
  };
}

// ─── Fallback reply when AI API is down ──────────────────────────────────────
function _buildNotFoundReply(userMessage, contextData) {
  const cat = _detectCategory(userMessage);
  if (cat && contextData.categories.includes(cat)) {
    return {
      replyText: `عذراً، لا يوجد ${_categoryAr(cat)} متاح حالياً في منطقتك. سنخطرك عند توفر أحد 🔔`,
      quickReplies: ["أبلغني عند التوفر", "عرض خدمات أخرى", "تواصل مع الدعم"],
    };
  }
  return _fallbackReply(userMessage, contextData);
}
// ─── Fallback محلي كامل ───────────────────────────────────────────────────────
function _fallbackReply(userMessage, contextData) {
  const m = userMessage.toLowerCase();

  if (
    m.includes("سباك") ||
    m.includes("plumb") ||
    m.includes("مياه") ||
    m.includes("أنابيب")
  ) {
    const w = contextData.workers.find((x) => x.category === "plumber");
    return {
      replyText: w
        ? `${w.name} سباك متاح قريب منك ⭐\nاضغط لحجزه الآن!`
        : "يمكنني مساعدتك في إيجاد سباك. ما المشكلة تحديداً؟",
      quickReplies: ["احجز الآن", "عرض السباكين", "طلب عرض سعر"],
    };
  }

  if (
    m.includes("كهرب") ||
    m.includes("electric") ||
    m.includes("تيار") ||
    m.includes("ضوء")
  ) {
    const w = contextData.workers.find((x) => x.category === "electrician");
    return {
      replyText: w
        ? `${w.name} كهربائي متاح اليوم! ⚡`
        : "لدينا كهربائيون متاحون. ما نوع العمل المطلوب؟",
      quickReplies: ["احجز الآن", "عرض الكهربائيين", "طلب عرض سعر"],
    };
  }

  if (
    m.includes("نجار") ||
    m.includes("carpen") ||
    m.includes("خشب") ||
    m.includes("أثاث")
  ) {
    const w = contextData.workers.find((x) => x.category === "carpenter");
    return {
      replyText: w
        ? `${w.name} نجار متاح لخدمتك! 🪚`
        : "لدينا نجارون متاحون. ما العمل المطلوب؟",
      quickReplies: ["احجز الآن", "عرض النجارين", "طلب عرض سعر"],
    };
  }

  if (
    m.includes("حجز") ||
    m.includes("book") ||
    m.includes("أريد") ||
    m.includes("عايز")
  ) {
    return {
      replyText: "يسعدني مساعدتك في الحجز! ما الخدمة التي تحتاجها؟",
      quickReplies: contextData.categories.length
        ? contextData.categories.slice(0, 4).map(_categoryAr)
        : ["سباكة", "كهرباء", "نجارة"],
    };
  }

  if (
    m.includes("سعر") ||
    m.includes("كم") ||
    m.includes("تكلفة") ||
    m.includes("price")
  ) {
    return {
      replyText:
        "الأسعار تختلف حسب نوع العمل والعامل. يمكنك طلب عرض سعر مجاني قبل تأكيد أي حجز.",
      quickReplies: ["طلب عرض سعر", "عرض الخدمات", "احجز عامل"],
    };
  }

  return {
    replyText:
      "مرحباً! أنا مساعد Servigo. يمكنني مساعدتك في إيجاد العمال وحجز الخدمات. بماذا تحتاج؟",
    quickReplies: contextData.categories.length
      ? contextData.categories.slice(0, 3).map(_categoryAr)
      : ["إيجاد عامل", "حجزاتي", "تواصل مع الدعم"],
  };
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function _getQuickRepliesFromWorkers(matchedWorkers = []) {
  if (!matchedWorkers?.length) return ["عرض الخدمات", "تواصل مع الدعم"];
  return matchedWorkers
    .map((w) => `احجز ${w.name}`)
    .concat("عمال آخرين")
    .slice(0, 3);
}

function _detectCategory(msg) {
  const m = msg.toLowerCase();
  if (m.includes("سباك") || m.includes("plumb") || m.includes("مياه"))
    return "plumber";
  if (m.includes("كهرب") || m.includes("electric")) return "electrician";
  if (m.includes("نجار") || m.includes("carpen")) return "carpenter";
  return null;
}

function _categoryAr(cat) {
  const map = { plumber: "سباك", electrician: "كهربائي", carpenter: "نجار" };
  return map[cat] || cat;
}
