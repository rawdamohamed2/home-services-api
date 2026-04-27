import Joi from "joi";
import { objectIdRule } from "../../core/utils/validation.helper.js";

export const baseServiceValidationSchema = Joi.object({
  name: Joi.string().required().trim().min(3).max(50).messages({
    "string.min": "name must be at least 3 characters",
    "string.max": "name cannot exceed 50 characters",
    "any.required": "name  is required",
  }),
  category: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid ID format",
      "any.required": "category is required",
    }),
  basePrice: Joi.number().min(0).required().messages({
    "number.min": "basePrice cannot be negative",
    "any.required": "basePrice  is required",
  }),
  image: Joi.string().uri().trim().optional().messages({
    "string.uri": "Please provide a valid image URL",
  }),
}).unknown(false);

export const addServiceValidation = baseServiceValidationSchema
  .keys({
    description: Joi.string().optional().max(500).messages({
      "string.max": "description cannot exceed 500 characters",
    }),
    priceOptions: Joi.array().items(
      Joi.object({
        optionName: Joi.string().required(),
        optionType: Joi.string()
          .valid("fixed", "hourly", "area", "trip", "custom")
          .default("fixed"),
        values: Joi.array().items(Joi.number().min(0)),
        pricePerUnit: Joi.number().min(0).default(0),
        description: Joi.string().allow(""),
      }),
    ),
    estimatedTime: Joi.number().min(0).max(1440).messages({
      "number.min": "estimatedTime cannot be negative",
      "number.max": "estimatedTime cannot exceed 24 hours",
    }),
  })
  .unknown(false);

export const updateServiceValidation = baseServiceValidationSchema
  .keys({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid ID format",
      }),
  })
  .unknown(false);

export const serviceAddOptionValidation = Joi.object({
  serviceId: objectIdRule.required(),
  optionName: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Option name cannot be empty",
    "any.required": "Option name is required",
  }),
  optionType: Joi.string()
    .valid("fixed", "hourly", "area", "trip", "custom")
    .default("fixed")
    .required(),
  quantity: Joi.number().min(0).default(0).messages({
    "number.base": "Quantity must be a valid number",
    "number.min": "Quantity cannot be negative",
  }),
  pricePerUnit: Joi.number().min(0).default(0).required(),
  description: Joi.string().max(200).allow(""),
}).unknown(false);

export const serviceUpdateOptionValidation = Joi.object({
  serviceId: objectIdRule.required(),
  optionId: objectIdRule.required(),

  optionName: Joi.string().min(2).max(100).optional(),
  optionType: Joi.string()
    .valid("fixed", "hourly", "area", "trip", "custom")
    .optional(),
  quantity: Joi.number().min(0).optional(),
  pricePerUnit: Joi.number().min(0).optional(),
  description: Joi.string().max(200).allow("").optional(),
}).unknown(false);

export const serviceItemIdValidation = Joi.object({
  optionId: objectIdRule.required(),
  serviceId: objectIdRule.required(),
}).unknown(false);

export const ServiceItemQuantityValidation = Joi.object({
  optionId: objectIdRule.required(),
  serviceId: objectIdRule.required(),
  quantity: Joi.number().min(0).required(),
}).unknown(false);

export const ServiceIdValidation = Joi.object({
  serviceId: objectIdRule.required(),
}).unknown(false);

export const searchServicesValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(11).default(5).messages({
    "number.max": "page cannot exceed 11",
  }),
  category: Joi.string()
    .trim()
    .optional()
    .valid(
      "Air Conditioner",
      "Cleaning",
      "Furniture Moving",
      "Carpentry",
      "Water Heater",
      "Plumbing",
      "Electricity",
    )
    .messages({
      "any.only":
        "status must be one of Air Conditioner, Cleaning, Furniture Moving, Carpentry, Water Heater,\n" +
        "            Plumbing, Electricity ",
    }),
  status: Joi.boolean().optional(),

  name: Joi.string().min(4).optional(),

  id: objectIdRule.optional(),
}).unknown(false);
