import Joi from "joi";
import {phoneRegex, timeRegex, validDays,passwordPattern} from "../core/utils/validation.helper.js";

const objectIdRule = Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({ 'string.pattern.base': 'Invalid ID format' });

export const workerSearchSchema = Joi.object({
    page: Joi
        .number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi
        .number()
        .integer()
        .min(1)
        .max(11)
        .default(10)
        .messages({
            'number.max': 'page cannot exceed 11',
        }),
    category: Joi
        .string()
        .trim()
        .optional()
        // .valid("Air Conditioner", "Cleaning", "Furniture Moving", "Carpentry", "Water Heater",
        //     "Plumbing", "Electricity")
        .messages({
            'any.only': 'status must be one of Air Conditioner, Cleaning, Furniture Moving, Carpentry, Water Heater,\n' +
                '            Plumbing, Electricity ',
        })
    ,
    status:Joi
        .string()
        .trim()
        .valid("pending", "approved", "Suspended", "rejected")
        .messages({
            'any.only': 'status must be one of pending, approved, Suspended, rejected',
        })
        .optional(),
    name:Joi
        .string()
        .min(4)
        .optional(),

    id:objectIdRule.optional()
}).unknown(false);

export const getWorkerByIdSchema = Joi.object({

    id: objectIdRule.required()

}).unknown(false);

export const updateWorkerSchema = Joi.object({
    firstName: Joi
        .string()
        .trim()
        .min(3)
        .max(50)
        .optional()
        .messages({
            "string.min": "First name must be at least 3 characters",
            "string.max": "First name cannot exceed 50 characters",
        })
    , email: Joi
         .string()
         .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
         .optional()
         .messages({
                "string.email": "Please enter a valid email"
            }),
    phone: Joi
        .string()
        .optional()
        .pattern(phoneRegex)
        .messages({
        'string.pattern.base': 'Please enter a valid phone number',
    }),
    password:Joi
        .string()
        .trim()
        .optional()
        .min(6)
        .pattern(passwordPattern)
        .messages({
            "string.min": "Password must be at least 6 characters",
            "string.pattern.base": "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        }),
    lastName:Joi
        .string()
        .trim()
        .min(3)
        .max(50)
        .optional()
        .messages({
            "string.min": "First name must be at least 3 characters",
            "string.max": "First name cannot exceed 50 characters",
        }),
    bio: Joi
        .string()
        .min(20)
        .max(250)
        .optional()
        .messages({
            "string.empty":"The bio can't be empty",
            "string.min": "Bio must be at least 20 characters",
            "string.max": "Bio cannot exceed 500 characters",
        }),
}).unknown(false);

export const availabilityWorkerSchema = Joi.object({
    availability: Joi.array().items(
        Joi.object({
            day: Joi.string()
                .valid(...validDays).required().messages({
                    'any.required': 'day is required',
                }),
            from: Joi.string().pattern(timeRegex).required().messages({
                'any.required': 'from is required',
            }),
            to: Joi.string().pattern(timeRegex).required().messages({
                'any.required': 'to is required',
            }),
            isAvailable: Joi.boolean().required().messages({
                'any.required': 'isAvailable is required',
            }),
        }))
        .required()
        .messages({
            'any.required': 'availability is required',
        }),
}).unknown(false);

export const LocationWorkerSchema = Joi.object({
    lat: Joi.number()
        .min(-90)
        .max(90)
        .required()
        .messages({
            'number.min': 'Latitude must be between -90 and 90',
            'number.max': 'Latitude must be between -90 and 90',
            'any.required': 'Latitude is required'
        }),
    lng: Joi.number()
        .min(-180)
        .max(180)
        .required()
        .messages({
            'number.min': 'Longitude must be between -180 and 180',
            'number.max': 'Longitude must be between -180 and 180',
            'any.required': 'Longitude is required'
        })
}).unknown(false);

export const availabilityStatusSchema = Joi.object({
    status: Joi
        .string()
        .valid("online", "offline", "busy")
        .required(),
}).unknown(false);

export const workerBookingSchema = Joi.object({
    status: Joi
        .string()
        .valid('accepted', 'in-progress', 'completed')
        .optional(),
}).unknown(false);
