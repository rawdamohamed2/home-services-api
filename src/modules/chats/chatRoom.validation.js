import Joi from "joi";
import { objectIdRule } from "../../core/utils/validation.helper.js";

export const roomIdValidation = Joi.object({
  roomId: objectIdRule.required(),
}).unknown(false);
