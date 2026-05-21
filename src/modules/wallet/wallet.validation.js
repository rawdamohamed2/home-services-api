import Joi from "joi";

export const validate = (schema, source = "body") =>
  (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    next();
  };
