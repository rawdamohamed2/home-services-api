import Joi from "joi";

export const withdrawalSchema = Joi.object({
  amount: Joi.number().min(10).required().messages({
    "number.min": "Minimum withdrawal amount is 10 EGP",
    "number.base": "Amount must be a number",
  }),
  methodId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Withdrawal method ID is required",
  }),
});

export const rejectWithdrawalSchema = Joi.object({
  reason: Joi.string().min(5).max(300).required().messages({
    "string.empty": "Rejection reason is required",
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
