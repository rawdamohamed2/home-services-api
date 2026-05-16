import RolePermission from "../../modules/rolePermissions/rolePermission.model.js";
import ApiResponse from "../utils/ApiResponse.js";

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;
      console.log(userRole);
      if (userRole === "owner") {
        return next();
      }

      if (!["admin", "moderator"].includes(userRole)) {
        return ApiResponse.forbidden(res, "Access Denied: Admins only");
      }

      const roleData = await RolePermission.findOne({ role: userRole });

      if (!roleData || !roleData.permissions.includes(requiredPermission)) {
        return ApiResponse.forbidden(
          res,
          `Access Denied: ${userRole}s do not have permission to ${requiredPermission}`,
        );
      }

      next();
    } catch (error) {
      return ApiResponse.serverError(res, error.message);
    }
  };
};

export const checkPermissionAndRole = (role, requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;

      if (userRole === "owner") {
        return next();
      } else if (userRole === role) {
        return next();
      } else if (!["admin", "moderator"].includes(userRole)) {
        return ApiResponse.forbidden(res, "Access Denied: Admins only");
      }

      const roleData = await RolePermission.findOne({ role: userRole });

      if (!roleData || !roleData.permissions.includes(requiredPermission)) {
        return ApiResponse.forbidden(
          res,
          `Access Denied: ${userRole}s do not have permission to ${requiredPermission}`,
        );
      }

      next();
    } catch (error) {
      return ApiResponse.serverError(res, error.message);
    }
  };
};
