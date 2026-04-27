import Joi from 'joi';

export const createCategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            'any.required': 'Category name is required',
            'string.empty': 'Category name cannot be empty',
            'string.min': 'Category name must be at least 2 characters',
            'string.max': 'Category name cannot exceed 50 characters'
        }),
    isActive: Joi.boolean()
        .optional()
        .default(true)
}).unknown(false);

export const updateCategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .optional()
        .messages({
            'string.min': 'Category name must be at least 2 characters',
            'string.max': 'Category name cannot exceed 50 characters'
        }),
    isActive: Joi.boolean().optional()
}).unknown(true);

export const categoryIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid category ID format',
            'any.required': 'Category ID is required'
        })
}).unknown(false);

export const getCategoriesSchema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(50).default(10),
    isActive: Joi.string().valid('true', 'false'),
    search: Joi.string().max(100).optional()
}).unknown(false);