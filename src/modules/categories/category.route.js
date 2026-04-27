import { Router } from "express";
import {
  addCategory,
  getCategories,
  getCategory,
  updateCategoryById,
  deleteCategoryById,
  toggleStatus,
} from "./category.controller.js";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize, isStaff } from "../../core/middleware/roleMiddleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  getCategoriesSchema,
} from "./category.validation.js";
import { checkPermission } from "../../core/middleware/permissionMiddleware.js";

const categoryRouter = Router();

// Public Routes
categoryRouter.get("/", validate(getCategoriesSchema), getCategories);
categoryRouter.get("/:id", validate(categoryIdSchema), getCategory);

// Admin Only Routes
categoryRouter.post(
  "/",
  protect,
  isStaff,
  checkPermission("manage_services"),
  validate(createCategorySchema),
  addCategory,
);

categoryRouter.patch(
  "/:id",
  protect,
  isStaff,
  checkPermission("manage_services"),
  validate(updateCategorySchema),
  updateCategoryById,
);

categoryRouter.patch(
  "/:id/toggle-status",
  protect,
  isStaff,
  checkPermission("manage_services"),
  validate(categoryIdSchema),
  toggleStatus,
);

categoryRouter.delete(
  "/:id",
  protect,
  isStaff,
  checkPermission("manage_services"),
  validate(categoryIdSchema),
  deleteCategoryById,
);

export default categoryRouter;
