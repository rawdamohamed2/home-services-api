import { Router } from "express";
import {
  addPermission,
  addRole,
  addRolePermission,
  editRolePermission,
  getRolePermissions,
} from "./rolePermission.controller.js";
import { validate } from "../../core/middleware/validate.js";
import {
  roleValidationSchema,
  RolePermissionValidationSchema,
  permissionValidationSchema,
} from "./rolePermission.vaildation.js";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize, isStaff } from "../../core/middleware/roleMiddleware.js";
import { checkPermission } from "../../core/middleware/permissionMiddleware.js";

const roleRouter = Router();

roleRouter.post(
  "/add",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(RolePermissionValidationSchema),
  addRolePermission,
);
roleRouter.post(
  "/role/add",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(roleValidationSchema),
  addRole,
);
roleRouter.post(
  "/permission/:roleId/add",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(permissionValidationSchema),
  addPermission,
);
roleRouter.get(
  "/",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  getRolePermissions,
);
roleRouter.patch(
  "/:roleId/edit",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  editRolePermission,
);

export default roleRouter;
