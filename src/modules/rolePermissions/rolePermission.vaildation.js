import Joi from "joi";
import {objectIdRule} from "../../core/utils/validation.helper.js";

export const RolePermissionValidationSchema  = Joi.object({
    role: Joi
        .string()
        .required()
        .trim()
        .min(3)
        .max(20)
        .lowercase(),
    permissions: Joi.array().items(
        Joi.string().valid(
            'manage_users',
            'manage_bookings',
            'manage_services',
            'manage_notifications',
            'manage_ChatAndReviews',
            'manage_settings'
        )
    ).messages({
        'any.only': 'Invalid permission type provided. Must be manage_users, manage_bookings, manage_settings, manage_notifications, manage_ChatAndReviews, manage_services'
    }),
}).unknown(false);

export const roleValidationSchema = Joi.object({
    role: Joi
        .string()
        .required()
        .trim()
        .min(3)
        .max(20)
        .lowercase(),
}).unknown(false);

export const permissionValidationSchema = Joi.object({
    roleId:objectIdRule,
    permissions: Joi.array().items(
        Joi.string().valid(
            'manage_users',
            'manage_bookings',
            'manage_services',
            'manage_notifications',
            'manage_ChatAndReviews',
            'manage_settings'
        )
    ).messages({
        'any.only': `Invalid permission type provided.
         Must be manage_users, manage_bookings, 
         manage_settings, manage_notifications, 
         manage_ChatAndReviews, manage_services`
    }),
}).unknown(false);