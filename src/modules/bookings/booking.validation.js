import Joi from "joi";
import { objectIdRule } from "../../core/utils/validation.helper.js";

export const createBookingValidation = Joi.object({
  service: objectIdRule.required(),

  scheduledDate: Joi.date().iso().greater("now").required().messages({
    "date.greater": "Booking date must be in the future",
  }),

  selectedOptions: Joi.array()
    .items(
      Joi.object({
        optionId: objectIdRule.required(),
        quantity: Joi.number().min(1).required(),
      }),
    )
    .min(1)
    .required(),

  location: Joi.object({
    type: Joi.string().valid("Point", "point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      details: Joi.string().allow("", null),
    }).required(),
  }).required(),

  notes: Joi.string().max(500).allow("", null),

  duration: Joi.number().min(1).required(),
}).unknown(false);

export const searchBookingValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(50).default(5).messages({
    "number.max": "page cannot exceed 11",
  }),

  status: Joi.string()
    .trim()
    .valid(
      "pending",
      "accepted",
      "in-progress",
      "completed",
      "cancelled",
      "refunded",
    )
    .messages({
      "any.only":
        "status must be one of pending, accepted, in-progress, completed, cancelled, refunded",
    })
    .optional(),

  dateFrom: Joi.date().iso().optional().messages({
    "date.format": "dateFrom must be a valid ISO date",
  }),

  dateTo: Joi.date().iso().greater(Joi.ref("dateFrom")).messages({
    "date.greater": "dateTo must be after dateFrom",
  }),

  id: objectIdRule.optional(),
}).unknown(false);

export const nearByBookingValidation = Joi.object({
  lat: Joi.number().min(-90).max(90).required().messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
    "any.required": "Latitude is required",
  }),
  lng: Joi.number().min(-180).max(180).required().messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
    "any.required": "Longitude is required",
  }),
  maxDistance: Joi.number().min(1000).required().messages({
    "number.min": "maxDistance must be greater than 1000",
    "any.required": "maxDistance is required",
  }),
}).unknown(false);

export const IdBookingValidation = Joi.object({
  id: objectIdRule.required(),
}).unknown(false);

export const updateBookingValidation = IdBookingValidation.keys({
  scheduledDate: Joi.date().iso().greater("now").required().messages({
    "date.greater": "Booking date must be in the future",
  }),
  location: Joi.object({
    type: Joi.string().valid("Point", "point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      details: Joi.string().allow("", null),
    }).required(),
  }).required(),
});

export const cancelBookingValidation = IdBookingValidation.keys({
  reason: Joi.string().max(100).allow("", null),
});

export const StatusBookingValidation = IdBookingValidation.keys({
  note: Joi.string().max(50).allow("", null),
  status: Joi.string()
    .trim()
    .valid(
      "pending",
      "accepted",
      "in-progress",
      "completed",
      "cancelled",
      "refunded",
    )
    .messages({
      "any.only":
        "status must be one of pending, accepted, in-progress, completed, cancelled, refunded",
    })
    .required(),
});
export const BookingCompletedSchema = Joi.object({
  bookingId: objectIdRule.required(),
}).unknown(false);
