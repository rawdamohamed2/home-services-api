import Router from "express";
import { validate } from "../../core/middleware/validate.js";
import {
  addAdmin,
  changePassword,
  deleteAdmin,
  editAdmin,
  getAdminById,
  getAllAdmins,
  toggleAdminBlock,
} from "./admin.controller.js";
import { isStaff } from "../../core/middleware/roleMiddleware.js";
import {
  adminEditingSchema,
  adminIdSchema,
  adminPasswordSchema,
  adminSearchSchema,
  adminValidationSchema,
} from "./admin.validation.js";
import { protect } from "../../core/middleware/authMiddleware.js";
import { checkPermission } from "../../core/middleware/permissionMiddleware.js";

const AdminRouter = Router();

AdminRouter.post(
  "/add",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(adminValidationSchema),
  addAdmin,
);

AdminRouter.get(
  "/",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(adminSearchSchema),
  getAllAdmins,
);

AdminRouter.get(
  "/:id",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(adminIdSchema),
  getAdminById,
);
AdminRouter.patch(
  "/edit/password",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(adminPasswordSchema),
  changePassword,
);
AdminRouter.patch(
  "/:id/edit",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(adminEditingSchema),
  editAdmin,
);
AdminRouter.delete(
  "/:id/delete",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(adminIdSchema),
  deleteAdmin,
);
AdminRouter.patch(
  "/:id/block",
  protect,
  isStaff,
  checkPermission("manage_settings"),
  validate(adminIdSchema),
  toggleAdminBlock,
);

export default AdminRouter;
