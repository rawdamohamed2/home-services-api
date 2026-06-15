import * as messageService from "./message.service.js";
import { emitToRoom, emitToUser, isUserOnline } from "../../socket/socket.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import { notifyNewMessage } from "../notifications/Notification.service.js";

export const getMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id;
    const data = req.query;
    const { messages, total, page, limit } =
      await messageService.getRoomMessages(roomId, userId, data);
    return ApiResponse.sendPaginated(
      res,
      messages,
      total,
      page,
      limit,
      "Messages fetched",
    );
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const sendMessage = async (req, res) => {
  const roomId = req.params.roomId;
  const user = req.user;
  const data = req.body;
  try {
    const { message, room } = await messageService.createMessage(
      roomId,
      user,
      data,
    );

    // Real-time: broadcast new message to room participants
    emitToRoom(room._id, "message:new", { roomId: room._id, message });

    const senderName = `${req.user.firstName} ${req.user.lastName}`;

    for (const participant of room.participants) {
      const uid = participant._id.toString();
      if (uid === req.user._id.toString()) continue;

      if (!isUserOnline(uid)) {
        await notifyNewMessage(
          uid,
          { roomId: room._id.toString(), messageId: message._id.toString() },
          { senderName, messageText: req.body.message },
        );
      }
    }

    if (room.type === "user_bot") {
      try {
        const botMessage = await messageService.generateBotReply(
          room,
          data.message,
        );

        emitToUser(req.user._id, "message:new", {
          roomId: room._id,
          message: botMessage,
        });

        return ApiResponse.success(
          res,
          { message, botMessage },
          "Message sent",
          201,
        );
      } catch (err) {
        return ApiResponse.error(res, err.message);
      }
    }

    return ApiResponse.success(res, { message }, "Message sent", 201);
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.handleMongooseError(res, err);
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;
    const message = await messageService.deleteMessage(messageId, userId);

    emitToRoom(message.chatRoom, "message:deleted", {
      messageId: message._id,
      roomId: message.chatRoom,
    });

    return ApiResponse.success(res, null, "Message deleted");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;
    const { reaction } = req.body;

    const message = await messageService.addReaction(
      messageId,
      userId,
      reaction,
    );

    emitToRoom(message.chatRoom, "message:reaction", {
      messageId: message._id,
      roomId: message.chatRoom,
      userId: req.user._id,
      reaction: req.body.reaction,
    });

    return ApiResponse.success(res, message, "Reaction added");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};
