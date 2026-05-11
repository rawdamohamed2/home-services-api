import ApiResponse from "../utils/ApiResponse.js";

const errorHandler = (err, req, res, next) => {
  let message = err.message || "Internal Server Error";
  let statusCode = err.statusCode || 500;

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    ApiResponse.error(res, "Validation failed", 400, errors);
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (err.name === "CastError") {
    ApiResponse.error(res, `Invalid ${err.path}: ${err.value}`, 400);
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    ApiResponse.error(res, `Duplicate value for field: ${field}`, 409);
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    ApiResponse.error(res, "Invalid token", 401);
  }
  if (err.name === "TokenExpiredError") {
    ApiResponse.error(res, "Token expired", 401);
  }

  // Log non-operational errors
  if (!err.isOperational) {
    console.error("💥 UNHANDLED ERROR:", err);
  }

  ApiResponse.error(res, message, statusCode);
};

export default errorHandler;
