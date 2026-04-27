import ApiResponse from "../utils/ApiResponse.js";
import RolePermission from "../../modules/rolePermissions/rolePermission.model.js";

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return ApiResponse.forbidden(res, "Forbidden: insufficient role");
        }
        next();
    };
};

export const isStaff = async (req, res, next) => {
    if (req.user.role === 'owner') return next();

    const roleExists = await RolePermission.findOne({ role: req.user.role });
    if (!roleExists) {
        return ApiResponse.forbidden(res, "Access denied: Staff only");
    }
    next();
};