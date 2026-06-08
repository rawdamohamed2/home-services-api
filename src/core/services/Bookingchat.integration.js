import { createBookingRoom } from "../../modules/chats/chatRoom.service.js";
import { emitToUser } from "../../socket/socket.js";
import { EVENTS } from "../../socket/socket.events.js";

export const onBookingAccepted = async (booking) => {
  try {
    const room = await createBookingRoom(
      booking._id,
      booking.user,
      booking.worker.user._id,
    );
    console.log(booking.worker.user._id);
    emitToUser(booking.user, EVENTS.WORKER_ASSIGNED, {
      bookingId: booking._id,
      chatRoomId: room._id,
      message: "Your worker accepted the booking. You can now chat!",
    });

    emitToUser(booking.worker, "chat:room_opened", {
      bookingId: booking._id,
      chatRoomId: room._id,
      message: "New chat opened for your accepted booking.",
    });

    return room;
  } catch (err) {
    console.error("[BookingChat] onBookingAccepted failed:", err.message);
  }
};

export const onBookingCompleted = async (booking) => {
  try {
    const ChatRoom = (await import("../../modules/chats/ChatRoom.model.js"))
      .default;
    const room = await ChatRoom.findOne({ booking: booking._id });
    if (!room) return;

    room.status = "closed";
    await room.save();

    [booking.user, booking.worker].forEach((uid) => {
      if (uid)
        emitToUser(uid, EVENTS.BOOKING_COMPLETED, {
          bookingId: booking._id,
          chatRoomId: room._id,
        });
    });
  } catch (err) {
    console.error("[BookingChat] onBookingCompleted failed:", err.message);
  }
};

export const onBookingCancelled = async (booking) => {
  try {
    const ChatRoom = (await import("../../modules/chats/ChatRoom.model.js"))
      .default;
    const room = await ChatRoom.findOne({ booking: booking._id });
    if (!room) return;

    room.status = "closed";
    await room.save();

    [booking.user, booking.worker].forEach((uid) => {
      if (uid)
        emitToUser(uid, EVENTS.BOOKING_CANCELLED, {
          bookingId: booking._id,
          chatRoomId: room._id,
        });
    });
  } catch (err) {
    console.error("[BookingChat] onBookingCancelled failed:", err.message);
  }
};
