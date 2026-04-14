import Joi from "joi";

export const baseServiceValidationSchema = Joi.object({
    name: Joi
        .string()
        .required()
        .trim()
        .min(3)
        .max(50)
        .messages({
            "string.min":"name must be at least 3 characters",
            "string.max":"name cannot exceed 50 characters",
            'any.required': 'name  is required',
        }),
    category:Joi
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid ID format',
            'any.required': 'category is required'
        }),
    basePrice:Joi
        .number()
        .min(0)
        .required()
        .messages({
            "number.min":"basePrice cannot be negative",
            'any.required': 'basePrice  is required',
        }),
}).unknown(false);

export const addServiceValidation = baseServiceValidationSchema.keys({
    description:Joi
        .string()
        .optional()
        .max(500)
        .messages({
            "string.max":"description cannot exceed 500 characters",
        }),
    image:Joi
        .string()
        .uri()
        .trim()
        .required()
        .messages({
            'string.uri': 'Please provide a valid image URL',
            'any.required': 'Profile image is required'
        }),
    estimatedTime:Joi
        .number()
        .min(0)
        .max(1440)
        .messages({
            "number.min":"estimatedTime cannot be negative",
            'number.max': 'estimatedTime cannot exceed 24 hours',
        }),
    priceOptions: Joi.array().items(
        Joi.object({
            optionName: Joi.string().required(),
            optionType: Joi.string().valid('fixed', 'hourly', 'area', 'trip', 'custom').default('fixed'),
            values: Joi.array().items(Joi.number().min(0)),
            pricePerUnit: Joi.number().min(0).default(0),
            description: Joi.string().allow('')
        })
    )
}).unknown(false);

export const updateServiceValidation = baseServiceValidationSchema.keys({
    id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid ID format'
        }),
    image:Joi
        .string()
        .uri()
        .trim()
        .optional()
        .messages({
            'string.uri': 'Please provide a valid image URL',
        }),
})