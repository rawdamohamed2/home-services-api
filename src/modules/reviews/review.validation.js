import Joi from "joi";

// ── User: Create Review ────────────────────────────────────
export const createReviewSchema = Joi.object({
  workerId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Worker ID is required",
  }),
  bookingId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Booking ID is required",
  }),
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.min": "Rating must be between 1 and 5",
    "number.max": "Rating must be between 1 and 5",
    "number.base": "Rating must be a number",
  }),
  comment: Joi.string().trim().max(500).optional().allow(null, ""),
}).or("rating", "comment").messages({
  "object.missing": "Please provide a rating or a comment",
});

// ── User: Update Review ────────────────────────────────────
export const updateReviewSchema = Joi.object({
  rating:  Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().trim().max(500).optional().allow(null, ""),
}).min(1);

// ── Report Comment ─────────────────────────────────────────
export const reportCommentSchema = Joi.object({
  reviewId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Review ID is required",
  }),
  reason: Joi.string()
    .valid("spam_or_misleading", "offensive_or_abusive", "fake_review", "other")
    .required()
    .messages({ "any.only": "Invalid report reason" }),
  otherReason: Joi.when("reason", {
    is:        "other",
    then:      Joi.string().trim().min(3).max(300).required().messages({ "string.empty": "Please specify the reason" }),
    otherwise: Joi.string().optional().allow(null, ""),
  }),
});

// ── Admin: Report action ───────────────────────────────────
export const reportActionSchema = Joi.object({
  notes: Joi.string().max(500).optional().allow(null, ""),
});

// ── Middleware ─────────────────────────────────────────────
export const validate = (schema, source = "body") =>
  (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    next();
  };
