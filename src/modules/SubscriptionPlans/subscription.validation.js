import Joi from "joi";

//  User: Subscribe 
export const subscribeSchema = Joi.object({
  planId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Plan ID is required",
    "string.length": "Invalid Plan ID",
  }),
  paymentMethodId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Payment method is required",
  }),
});

//  Admin: Create / Update Plan 
export const createPlanSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Plan name is required",
  }),
  description: Joi.string().max(500).optional(),
  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
  }),
  discount: Joi.number().min(0).max(100).default(0),
  durationMonths: Joi.number().min(1).default(1).messages({
    "number.min": "Duration must be at least 1 month",
  }),
  features: Joi.array().items(Joi.string().trim()).default([]),
  isPremium: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  image: Joi.string().uri().optional().allow(null, ""),
});

export const updatePlanSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).max(100).optional(),
  durationMonths: Joi.number().min(1).optional(),
  isPremium: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  image: Joi.string().uri().optional().allow(null, ""),
});

//  Admin: Add Feature 
export const addFeatureSchema = Joi.object({
  feature: Joi.string().min(2).max(200).required().messages({
    "string.empty": "Feature text is required",
  }),
});



//  Middleware 
export const validate = (schema, source = "body") =>
  (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    next();
  };
