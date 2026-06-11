import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";

import * as roomCtrl from "./chatRoom.controller.js";
import * as msgCtrl from "../messages/message.controller.js";
import * as ticketCtrl from "../support/supportTicket.controller.js";
import { checkPermission } from "../../core/middleware/permissionMiddleware.js";
import { validate } from "../../core/middleware/validate.js";
import { roomIdValidation } from "./chatRoom.validation.js";
import {
  getMessagesValidation,
  messageIdValidation,
  reactToMessageValidation,
  sendMessageValidation,
} from "../messages/message.validation.js";
import {
  assignTicketValidation,
  closeTicketValidation,
  createTicketValidation,
  getTicketValidation,
  IdValidation,
  RatingValidation,
} from "../support/supportTicket.validtion.js";

const router = express.Router();

router.use(protect);

// ═══════════════════════════════════════════════════════════════════
// ROOMS
// ═══════════════════════════════════════════════════════════════════
// GET    /chat/rooms                  → all my rooms
// GET    /chat/rooms/bot              → get or create bot room
// GET    /chat/rooms/chat/rooms/support           → get or create support room (?ticketId=)
// GET    /chat/rooms/:roomId          → single room
// PATCH  /chat/rooms/:roomId/read     → mark room as read
// PATCH  /chat/rooms/:roomId/close    → close room [admin/support]

router.get("/rooms", roomCtrl.getMyRooms);
router.get("/rooms/bot", roomCtrl.getBotRoom);
//router.get("/rooms/support", roomCtrl.getSupportRoom);
router.get("/rooms/:roomId", validate(roomIdValidation), roomCtrl.getRoom);
//router.patch("/rooms/:roomId/read", roomCtrl.markRoomRead);
router.patch(
  "/rooms/:roomId/close",
  validate(roomIdValidation),
  checkPermission("manage_ChatAndReviews"),
  roomCtrl.closeRoom,
);

// ═══════════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════════
// GET    /chat/rooms/:roomId/messages          → paginated messages (?page=1&limit=50)
// POST   /chat/rooms/:roomId/messages          → send message
// DELETE /chat/messages/:messageId             → soft-delete (own message only)
// POST   /chat/messages/:messageId/react       → add/update reaction

router.get(
  "/rooms/:roomId/messages",
  validate(getMessagesValidation),
  msgCtrl.getMessages,
);
router.post(
  "/rooms/:roomId/messages",
  validate(sendMessageValidation),
  msgCtrl.sendMessage,
);
router.delete(
  "/messages/:messageId",
  validate(messageIdValidation),
  msgCtrl.deleteMessage,
);
router.post(
  "/messages/:messageId/react",
  validate(reactToMessageValidation),
  msgCtrl.reactToMessage,
);

// ═══════════════════════════════════════════════════════════════════
// TICKETS
// ═══════════════════════════════════════════════════════════════════
// POST   /chat/tickets                → create ticket (auto-opens support room)
// GET    /chat/tickets                → my tickets (?status=open)
// GET    /chat/tickets/:id            → single ticket
// PATCH  /chat/tickets/:id/rate       → user rates resolved ticket { rating: 1-5 }
//
// [admin/support only]
// GET    /chat/tickets/admin/open     → all open tickets
// GET    /chat/tickets/admin/stats    → statistics
// PATCH  /chat/tickets/:id/assign     → assign { adminId }
// PATCH  /chat/tickets/:id/resolve    → resolve
// PATCH  /chat/tickets/:id/close      → close { reason }
// PATCH  /chat/tickets/:id/note       → internal note { note }

router.post(
  "/tickets",
  validate(createTicketValidation),
  ticketCtrl.createTicket,
);
router.get("/tickets", validate(getTicketValidation), ticketCtrl.getMyTickets);
router.get("/tickets/:id", validate(IdValidation), ticketCtrl.getTicket);
router.patch(
  "/tickets/:id/rate",
  validate(RatingValidation),
  ticketCtrl.rateTicket,
);

router.use(checkPermission("manage_notifications"));
router.get("/tickets/admin/open", ticketCtrl.getAllOpenTickets);
//router.get("/tickets/admin/stats", ticketCtrl.getStats);
router.patch(
  "/tickets/:id/assign",
  validate(assignTicketValidation),
  ticketCtrl.assignTicket,
);
router.patch(
  "/tickets/:id/resolve",
  validate(IdValidation),
  ticketCtrl.resolveTicket,
);
router.patch(
  "/tickets/:id/close",
  validate(closeTicketValidation),
  ticketCtrl.closeTicket,
);
router.patch("/tickets/:id/note", ticketCtrl.addNote);

export default router;
