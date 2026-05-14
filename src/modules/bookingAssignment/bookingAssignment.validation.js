import Joi from "joi";
import { objectIdRule } from "../../core/utils/validation.helper.js";

export const filterAssignmentValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(11).default(5).messages({
    "number.max": "page cannot exceed 11",
  }),

  status: Joi.string()
    .trim()
    .valid(
      "pending",
      "sent",
      "viewed",
      "accepted",
      "rejected",
      "countered",
      "user_accepted",
      "user_rejected",
      "expired",
    )
    .messages({
      "any.only":
        "status must be one of pending, sent, viewed, accepted, rejected, countered, user_accepted, user_rejected, expired",
    })
    .optional(),
}).unknown(false);

export const IdAssignmentValidation = Joi.object({
  id: objectIdRule.required(),
}).unknown(false);

export const reasonAssignmentValidation = IdAssignmentValidation.keys({
  reason: Joi.string().max(100).allow("", null),
}).unknown(false);

export const counterAssignmentValidation = IdAssignmentValidation.keys({
  note: Joi.string().max(100).allow("", null),
  counterPrice: Joi.number().min(50).required(),
}).unknown(false);

export const bookingIdAssignmentValidation = Joi.object({
  bookingId: objectIdRule.required(),
}).unknown(false);
