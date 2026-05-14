import Joi from "joi";
import { objectIdRule } from "../../core/utils/validation.helper.js";

export const idValidation = Joi.object({
  id: objectIdRule.required(),
}).unknown(false);
