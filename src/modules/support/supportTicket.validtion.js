import Joi from "joi";
import { objectIdRule } from "../../core/utils/validation.helper.js";
import { closeTicket } from "./supportTicket.service.js";

export const roomIdValidation = Joi.object({
  roomId: objectIdRule.required(),
}).unknown(false);
export const IdValidation = Joi.object({
  id: objectIdRule.required(),
}).unknown(false);

export const createTicketValidation = Joi.object({
  subject: Joi.string()
    .trim()
    .valid(
      "booking_issue",
      "service_inquiry",
      "payment_issue",
      "complaint",
      "suggestion",
      "technical_issue",
    )
    .messages({
      "any.only":
        "subject must be one of [booking_issue, service_inquiry, payment_issue, complaint, suggestion, technical_issue]",
    })
    .default("text"),

  description: Joi.string().max(500).optional(),

  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .messages({
      "any.only": "subject must be one of [low, medium, high, urgent]",
    })
    .default("medium"),

  attachments: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required().messages({
          "string.uri": "Attachment URL must be a valid URL",
          "any.required": "Attachment URL is required",
        }),

        type: Joi.string().optional().messages({
          "any.required": "Attachment type is required",
        }),

        name: Joi.string().default("img").messages({
          "any.required": "Attachment name is required",
        }),

        size: Joi.number().positive().optional().messages({
          "number.positive": "Attachment size must be a positive number",
          "any.required": "Attachment size is required",
        }),
      }),
    )
    .optional(),
}).unknown(false);

export const getTicketValidation = Joi.object({
  status: Joi.string()
    .trim()
    .valid("open", "in_progress", "resolved", "closed")
    .messages({
      "any.only":
        "status must be one of [ open , in_progress , resolved , closed ]",
    })
    .default("open"),
}).unknown(false);

export const RatingValidation = Joi.object({
  rating: Joi.number().positive().min(0).max(5).required(),
}).unknown(false);

export const assignTicketValidation = IdValidation.keys({
  adminId: objectIdRule.required(),
}).unknown(false);

export const closeTicketValidation = IdValidation.keys({
  reason: Joi.string().trim().max(300),
}).unknown(false);
