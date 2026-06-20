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
    message: Joi.string().min(1).optional().allow(""),

    messageType: Joi.string()
      .trim()
      .valid("text", "image", "file", "location", "system", "template")
      .messages({
        "any.only":
          "message Type must be one of text, image, file, location, system, template",
      })
      .default("text"),

    replyTo: objectIdRule.optional(),

    attachments: Joi.any().optional(),
  })
  .unknown(true); // 3. خليناها true عشان لو Multer رمى أي داتا زيادة بتاعة الملفات الـ Joi ميعترضش

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
