import Joi from "joi";

export const addCardSchema = Joi.object({
  cardholderName: Joi.string().min(3).max(60).required().messages({
    "string.empty": "Cardholder name is required",
  }),
  cardNumber: Joi.string()
    .pattern(/^[\d\s]{16,19}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid card number",
      "string.empty": "Card number is required",
    }),
  expiryMonth: Joi.string()
    .pattern(/^(0[1-9]|1[0-2])$/)
    .required()
    .messages({ "string.pattern.base": "Expiry month must be MM format" }),
  expiryYear: Joi.string()
    .pattern(/^\d{2}$/)
    .required()
    .messages({ "string.pattern.base": "Expiry year must be YY format" }),
  securityCode: Joi.string()
    .pattern(/^\d{3,4}$/)
    .required()
    .messages({ "string.pattern.base": "Invalid security code" }),
});

export const addInstapaySchema = Joi.object({
  instapayId: Joi.string().min(3).max(50).required().messages({
    "string.empty": "InstaPay ID is required",
  }),
  accountHolderName: Joi.string().min(3).max(60).required().messages({
    "string.empty": "Account holder name is required",
  }),
});

export const initiatePaymentSchema = Joi.object({
  bookingId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Booking ID is required",
  }),
  paymentMethod: Joi.string()
    .valid("card", "instapay", "cash")
    .required()
    .messages({
      "any.only": "Payment method must be card, instapay, or cash",
    }),
});

export const validate = (schema, source = "body") =>
  (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    next();
  };
