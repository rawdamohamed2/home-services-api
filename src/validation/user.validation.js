import Joi from 'joi';
import { phoneRegex, passwordPattern } from '../core/utils/validation.helper.js';


export const updateProfileSchema = Joi.object({
    firstName: Joi.string().trim().min(3).max(50).optional()
        .messages({
            "string.min": "First name must be at least 3 characters",
            "string.max": "First name cannot exceed 50 characters",
        }),

    lastName: Joi.string().trim().min(3).max(50).optional()
        .messages({
            "string.min": "Last name must be at least 3 characters",
            "string.max": "Last name cannot exceed 50 characters",
        }),


    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).optional()
        .messages({ "string.email": "Please enter a valid email" }),

    phone: Joi.string().optional().pattern(phoneRegex)
        .messages({ 'string.pattern.base': 'Please enter a valid phone number' }),

    address: Joi.string().max(200).optional()
        .messages({ "string.max": "Address cannot exceed 200 characters" }),
    enabledLocation: Joi.boolean().optional(),

    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).optional()
        .messages({ "string.email": "Please enter a valid email" }),
    phone: Joi.string().optional().pattern(phoneRegex)
        .messages({ 'string.pattern.base': 'Please enter a valid phone number' }),
    address: Joi.string().max(200).optional()
        .messages({ "string.max": "Address cannot exceed 200 characters" }),
    enabledLocation: Joi.boolean().optional(),
  
    location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array()
            .items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90))
            .length(2)
            .required()
            .messages({
                'array.length': 'Coordinates must have exactly 2 values [longitude, latitude]',
                'number.min': 'Longitude must be between -180 and 180',
                'number.max': 'Latitude must be between -90 and 90'
            })
    }).when('enabledLocation', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    })
}).unknown(false);

export const changePasswordSchema = Joi.object({
  
    currentPassword: Joi.string().trim().required().min(6)
        .pattern(passwordPattern)
        .messages({
            "any.required": "Current password is required",
            "string.empty": "Current password cannot be empty",
            "string.min": "Password must be at least 6 characters",
            "string.pattern.base": "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        }),
    newPassword: Joi.string().trim().required().min(6)
        .pattern(passwordPattern)
        .messages({
            "string.min": "Password must be at least 6 characters",
            "any.required": "New password is required",
            "string.pattern.base": "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        }),
    confirmPassword: Joi.string().trim().valid(Joi.ref('newPassword')).required()
        .pattern(passwordPattern)
        .messages({
            "any.only": "Confirm password does not match new password",
            "any.required": "Confirm password is required",
            "string.pattern.base": "Password must be 8 to 64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        })
}).unknown(false);

export const uploadPhotoSchema = Joi.object({
    profileImage: Joi.string().uri().trim().required()
        .messages({
            'string.uri': 'Please provide a valid image URL',
            'any.required': 'Profile image is required'
        })
}).unknown(false);


export const userIdParamSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid user ID format',
            'any.required': 'User ID is required'
        })
}).unknown(false);

