import ApiResponse from "../utils/ApiResponse.js";

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return ApiResponse.forbidden(req, "Forbidden: insufficient role");
        }
        next();
    };
};