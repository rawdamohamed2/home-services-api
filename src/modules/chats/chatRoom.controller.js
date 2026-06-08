import * as chatRoomService from "./chatRoom.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

export const getMyRooms = async (req, res) => {
  const userId = req.user._id;
  try {
    const rooms = await chatRoomService.getUserRooms(userId);

    return ApiResponse.success(res, rooms, "Rooms fetched successfully");
  } catch (err) {
    return ApiResponse.handleMongooseError(res, err);
  }
};

export const getRoom = async (req, res) => {
  const roomId = req.params.roomId;
  const userId = req.user._id;
  try {
    const room = await chatRoomService.getRoomById(roomId, userId);
    return ApiResponse.success(res, room);
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const getBotRoom = async (req, res) => {
  const userId = req.user._id;
  try {
    const room = await chatRoomService.getOrCreateBotRoom(userId);
    return ApiResponse.success(res, room, "Bot room ready");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const getSupportRoom = async (req, res) => {
  const ticketId = req.query.ticketId;
  const userId = req.user._id;
  try {
    const room = await chatRoomService.getOrCreateSupportRoom(
      userId,
      ticketId || null,
    );
    return ApiResponse.success(res, room, "Support room ready");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const markRoomRead = async (req, res) => {
  const roomId = req.params.roomId;
  const userId = req.user._id;
  try {
    await chatRoomService.markRoomRead(roomId, userId);
    return ApiResponse.success(res, null, "Marked as read");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};

export const closeRoom = async (req, res) => {
  const roomId = req.params.roomId;
  try {
    const room = await chatRoomService.closeRoom(roomId);
    return ApiResponse.success(res, room, "Room closed");
  } catch (err) {
    if (err.isOperational)
      return ApiResponse.error(res, err.message, err.statusCode);
    return ApiResponse.serverError(res);
  }
};
