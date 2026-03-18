import Joi from 'joi';


export const messages = {
    'string.base': '{{#label}} must be a string',
    'string.empty': '{{#label}} cannot be empty',
    'string.min': '{{#label}} must be at least {{#limit}} characters',
    'string.max': '{{#label}} cannot exceed {{#limit}} characters',
    'string.email': 'Please enter a valid email address',
    'string.pattern.base': '{{#label}} format is invalid',
    'any.required': '{{#label}} is required',
    'any.only': '{{#label}} must be one of {{#valids}}',
    'number.base': '{{#label}} must be a number',
    'number.min': '{{#label}} must be at least {{#limit}}',
    'number.max': '{{#label}} cannot exceed {{#limit}}',
    'array.base': '{{#label}} must be an array',
    'array.min': '{{#label}} must contain at least {{#limit}} items',
    'object.base': '{{#label}} must be an object'
};


export const phoneRegex = /^(0?1[0125][0-9]{8})$/;
export const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
export const allowedDomains = ['gmail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'ymail.com', 'rocketmail.com'];
export const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];



