import Joi from "joi";
import {phoneRegex, validDays, timeRegex, passwordPattern} from "../core/utils/validation.helper.js";


export const baseRegisterSchema = Joi.object({
    firstName: Joi
        .string()
        .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            "any.required":"The firstName is required",
            "string.empty":"The firstName can't be empty",
            "string.min": "First name must be at least 3 characters",
            "string.max": "First name cannot exceed 50 characters",
        }),
    lastName: Joi
        .string()
        .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            "any.required":"The lastName is required",
            "string.empty":"The lastName can't be empty",
            "string.min": "Last name must be at least 3 characters",
            "string.max": "Last name cannot exceed 50 characters",
        }),
    email: Joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required()
        .messages({
            "any.required":"The email is required",
            "string.empty":"The email can't be empty",
            "string.email": "Please enter a valid email"
        }),
    password: Joi
        .string()
        .trim()
        .required()
        .min(6)
        .pattern(passwordPattern)
        .messages({
            "string.min": "Password must be at least 6 characters",
            "any.required": "Password is required",
            "string.pattern.base": "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        }),
    phone: Joi
        .string()
        .required()
        .pattern(phoneRegex)
        .messages({
        'string.pattern.base': 'Please enter a valid phone number',
        'any.required': 'Phone number is required'
    }),
    profileImage: Joi.string()
        .uri()
        .optional()
        .default("https://res.cloudinary.com/dlbgzpo7s/image/upload/v1773087860/user-profile-icon-vector-avatar-600nw-2558760599_czvcso.webp"),

    enabledLocation: Joi.boolean().default(false),

    location: Joi.when("enabledLocation", {
        is: true,
        then: Joi.object({
            type: Joi.string()
                .valid("Point")
                .required(),
            coordinates: Joi.array()
                .items(
                    Joi.number().min(-180).max(180),
                    Joi.number().min(-90).max(90)
                )
                .length(2)
                .required()
        }).required(),
        otherwise: Joi.forbidden()
    }),

    address: Joi.string().optional(),
}).unknown(false);

export const userRegisterSchema = baseRegisterSchema.keys({
    role: Joi.string()
        .valid("user")
        .default("user")
        .optional()
        .messages({
            "any.only":"The role Must be user",
        })
}).unknown(false);

export const workerRegisterSchema = baseRegisterSchema.keys({

    role: Joi.string().valid("worker").default("worker"),
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
    categories: Joi.array()
        .items(
            Joi.string().hex().length(24)
        )
        .min(1)
        .required()
        .messages({
            "array.min": "At least one category is required",
            "any.required": "Categories are required"
        }),
    experienceYears: Joi.number()
        .min(0)
        .max(70)
        .default(0)
        .messages({
            "number.max": "The experience can't exceed 70 years"
        }),
    city: Joi.string()
        .required()
        .messages({
            "any.required": "The city is required"
        }),

    nationalIdFront: Joi.string()
        .uri()
        .required()
        .messages({
            "any.required": "National ID front image is required"
        }),
    nationalIdBack: Joi.string()
        .uri()
        .required()
        .messages({
            "any.required": "National ID back image is required"
        }),

    vehicleType: Joi.when("categories", {
        is: Joi.array().has(Joi.valid(process.env.VEHICLE_CATEGORY_ID)),
        then: Joi.string()
            .valid("truck", "van", "pickup")
            .required()
            .messages({
                "any.required": "Vehicle type is required for this category"
            }),
        otherwise: Joi.string()
            .valid("truck", "van", "pickup", "none")
            .default("none")
    }),

    licenseImage: Joi.when("categories", {
        is: Joi.array().has(Joi.valid(process.env.VEHICLE_CATEGORY_ID)),
        then: Joi.string()
            .uri()
            .required()
            .messages({
                "any.required": "License image is required for this category"
            }),
        otherwise: Joi.string().uri()
    }),

    availability: Joi.array().items(
        Joi.object({
            day: Joi.string()
                .valid(...validDays),
            from: Joi.string().pattern(timeRegex),
            to: Joi.string().pattern(timeRegex),
        })),
    availabilityStatus: Joi
        .string()
        .valid("online", "offline", "busy")
        .default("offline"),
    isAvailable: Joi.boolean().default(false),
}).unknown(false);

export const loginSchema = Joi.object({
    email: Joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required()
        .messages({
            "any.required":"The email is required",
            "string.empty":"The email can't be empty",
            "string.email": "Please enter a valid email"
        }),
    password: Joi
        .string()
        .trim()
        .required()
        .min(6)
        .pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[@\\-$])[a-zA-Z0-9@\\-$]{6,30}$'))
        .messages({
            "string.min": "Password must be at least 6 characters",
            "any.required": "Password is required",
            "string.pattern.base": "Password must contain uppercase letter, number and @ or - or $"
        }),
})

export const idSchema = Joi.object({
    userId: Joi.string().required(),
}).unknown(false);

export const verifyEmailSchema = idSchema.keys({
    otp: Joi.string().max(6).required().messages({
        "any.required": "The OTP is required",
        "number.max": "The Otp can't exceed 6 numbers",
        "any.e": "The OTP is required"
    })
}).unknown(false);

export const emailSchema = Joi.object({
    email: Joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required()
        .messages({
            "any.required":"The email is required",
            "string.empty":"The email can't be empty",
            "string.email": "Please enter a valid email"
        }),
}).unknown(false);

export const resetPasswordSchema = idSchema.keys({
    newPassword: Joi
        .string()
        .trim()
        .required()
        .min(6)
        .pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[@\\-$])[a-zA-Z0-9@\\-$]{6,30}$'))
        .messages({
            "string.min": "Password must be at least 6 characters",
            "any.required": "Password is required",
            "string.pattern.base": "Password must contain uppercase letter, number and @ or - or $"
        }),
    confirmPassword: Joi
        .string()
        .trim()
        .valid(Joi.ref("newPassword"))
        .required()
        .min(6)
        .pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[@\\-$])[a-zA-Z0-9@\\-$]{6,30}$'))
        .messages({
            "any.only": "Confirm password does not match password",
            "string.min": "Password must be at least 6 characters",
            "any.required": "Password is required",
            "string.pattern.base": "Password must contain uppercase letter, number and @ or - or $"
        }),
}).unknown(false);
