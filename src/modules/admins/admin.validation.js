import Joi from "joi";
import {
  objectIdRule,
  passwordPattern,
  phoneRegex,
} from "../../core/utils/validation.helper.js";
import { updateProfileSchema } from "../users/user.validation.js";

export const adminValidationSchema = Joi.object({
  firstName: Joi.string().trim().min(3).max(50).required().messages({
    "any.required": "The firstName is required",
    "string.empty": "The firstName can't be empty",
    "string.min": "First name must be at least 3 characters",
    "string.max": "First name cannot exceed 50 characters",
  }),
  lastName: Joi.string().trim().min(3).max(50).required().messages({
    "any.required": "The lastName is required",
    "string.empty": "The lastName can't be empty",
    "string.min": "Last name must be at least 3 characters",
    "string.max": "Last name cannot exceed 50 characters",
  }),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required()
    .messages({
      "any.required": "The email is required",
      "string.empty": "The email can't be empty",
      "string.email": "Please enter a valid email",
    }),
  password: Joi.string()
    .trim()
    .required()
    .min(6)
    .pattern(passwordPattern)
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required",
      "string.pattern.base":
        "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
  phone: Joi.string().optional().pattern(phoneRegex).messages({
    "string.pattern.base": "Please enter a valid phone number",
  }),
  role: Joi.string().required().trim().min(3).max(20).lowercase(),
  department: Joi.string()
    .valid(
      "operations",
      "finance",
      "customer_service",
      "technical",
      "management",
    )
    .default("management"),
  notes: Joi.string().max(500).allow("", null).messages({
    "string.max": "Notes cannot exceed 500 characters.",
  }),
  managedWorkers: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .messages({
      "string.pattern.base": "managedWorkers must contain valid ObjectIds.",
    }),
}).unknown(false);

export const adminSearchSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(11).default(10).messages({
    "number.max": "page cannot exceed 11",
  }),
  name: Joi.string().min(4).optional(),
  email: Joi.string().optional().messages({
    "string.empty": "The email can't be empty",
    "string.email": "Please enter a valid email",
  }),
}).unknown(false);

export const adminIdSchema = Joi.object({
  id: objectIdRule.required(),
}).unknown(false);

export const adminEditingSchema = updateProfileSchema
  .keys({
    id: objectIdRule.required(),
    role: Joi.string().valid("admin", "moderator").messages({
      "any.only": "role must be one of admin, moderator",
    }),
    password: Joi.string().trim().min(6).pattern(passwordPattern).messages({
      "string.min": "Password must be at least 6 characters",
      "string.pattern.base":
        "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
  })
  .unknown(false);

export const adminPasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .trim()
    .min(6)
    .pattern(passwordPattern)
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.pattern.base":
        "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
  newPassword: Joi.string().trim().min(6).pattern(passwordPattern).messages({
    "string.min": "Password must be at least 6 characters",
    "string.pattern.base":
      "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
  }),
  confirmPassword: Joi.string()
    .trim()
    .min(6)
    .pattern(passwordPattern)
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.pattern.base":
        "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
}).unknown(false);
