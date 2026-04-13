import Joi from 'joi';
import { phoneRegex } from '../core/utils/validation.helper.js';

export const updateProfileSchema = Joi.object({
    firstName: Joi
        .string()
        .trim()
        .min(3)
        .max(50)
        .optional()
        .messages({
            "string.min": "First name must be at least 3 characters",
            "string.max": "First name cannot exceed 50 characters",
        }),
    lastName: Joi
        .string()
        .trim()
        .min(3)
        .max(50)
        .optional()
        .messages({
            "string.min": "Last name must be at least 3 characters",
            "string.max": "Last name cannot exceed 50 characters",
        }),
    email: Joi
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
    address: Joi
        .string()
        .max(200)
        .optional()
        .messages({
            "string.max": "Address cannot exceed 200 characters",
        }),
    enabledLocation: Joi
        .boolean()
        .optional(),
    location: Joi
        .object({
            type: Joi
                .string()
                .valid('Point')
                .default('Point'),
            coordinates: Joi
                .array()
                .items(
                    Joi.number().min(-180).max(180),
                    Joi.number().min(-90).max(90)
                )
                .length(2)
                .required()
                .messages({
                    'array.length': 'Coordinates must have exactly 2 values [longitude, latitude]',
                    'number.min': 'Longitude must be between -180 and 180',
                    'number.max': 'Latitude must be between -90 and 90'
                })
        })
        .when('enabledLocation', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
}).unknown(false);

// تغيير كلمة المرور
export const changePasswordSchema = Joi.object({
    currentPassword: Joi
        .string()
        .trim()
        .required()
        .min(6)
        .messages({
            "any.required": "Current password is required",
            "string.empty": "Current password cannot be empty",
            "string.min": "Password must be at least 6 characters"
        }),
    newPassword: Joi
        .string()
        .trim()
        .required()
        .min(6)
        .pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[@\\-$])[a-zA-Z0-9@\\-$]{6,30}$'))
        .messages({
            "string.min": "Password must be at least 6 characters",
            "any.required": "New password is required",
            "string.pattern.base": "Password must contain uppercase letter, number and @ or - or $"
        }),
    confirmPassword: Joi
        .string()
        .trim()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            "any.only": "Confirm password does not match new password",
            "any.required": "Confirm password is required"
        })
}).unknown(false);

// رفع صورة البروفايل
export const uploadPhotoSchema = Joi.object({
    profileImage: Joi
        .string()
        .uri()
        .trim()
        .required()
        .messages({
            'string.uri': 'Please provide a valid image URL',
            'any.required': 'Profile image is required'
        })
}).unknown(false);

// حذف الحساب
export const deleteAccountSchema = Joi.object({
    reason: Joi
        .string()
        .max(200)
        .optional()
        .messages({
            "string.max": "Reason cannot exceed 200 characters"
        })
}).unknown(false);

// ID Param Validation
export const userIdParamSchema = Joi.object({
    id: Joi
        .string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid user ID format',
            'any.required': 'User ID is required'
        })
}).unknown(false);