import Joi from "joi";
import { objectIdRule } from "../../core/utils/validation.helper.js";

export const roomIdValidation = Joi.object({
  roomId: objectIdRule.required(),
}).unknown(false);
export const messageIdValidation = Joi.object({
  messageId: objectIdRule.required(),
}).unknown(false);

export const getMessagesValidation = roomIdValidation
  .keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(11).default(10).messages({
      "number.max": "page cannot exceed 11",
    }),
  })
  .unknown(false);

export const sendMessageValidation = roomIdValidation
  .keys({
    message: Joi.string().min(5).required(),

    messageType: Joi.string()
      .trim()
      .valid("text", "image", "file", "location", "system", "template")
      .messages({
        "any.only":
          "message Type must be one of text, file, location, system, template",
      })
      .default("text"),

    replyTo: objectIdRule.optional(),

    attachments: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required().messages({
            "string.uri": "Attachment URL must be a valid URL",
            "any.required": "Attachment URL is required",
          }),

          type: Joi.string().required().messages({
            "any.required": "Attachment type is required",
          }),

          name: Joi.string().required().messages({
            "any.required": "Attachment name is required",
          }),

          size: Joi.number().positive().required().messages({
            "number.positive": "Attachment size must be a positive number",
            "any.required": "Attachment size is required",
          }),
        }),
      )
      .optional(),
  })
  .unknown(false);

export const reactToMessageValidation = messageIdValidation
  .keys({
    reaction: Joi.string()
      .trim()
      .valid("👍", "❤️", "😂", "😮", "😢", "😡")
      .messages({
        "any.only": "Reaction must be one of [👍, ❤️, 😂, 😮, 😢, 😡]",
      })
      .required(),
  })
  .unknown(false);
