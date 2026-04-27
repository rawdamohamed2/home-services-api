import Router from "express";
import {
  addServiceValidation,
  searchServicesValidation,
  serviceAddOptionValidation,
  ServiceIdValidation,
  serviceItemIdValidation,
  serviceUpdateOptionValidation,
  updateServiceValidation,
} from "./service.validation.js";
import { validate } from "../../core/middleware/validate.js";
import {
  addService,
  addServiceItem,
  deleteService,
  deleteServiceItem,
  editService,
  editServiceItem,
  getServiceById,
  getServices,
} from "./Service.controller.js";
import { isStaff } from "../../core/middleware/roleMiddleware.js";
import { protect } from "../../core/middleware/authMiddleware.js";
import { checkPermission } from "../../core/middleware/permissionMiddleware.js";

const serviceRouter = Router();

serviceRouter.post(
  "/add",
  validate(addServiceValidation),
  protect,
  isStaff,
  checkPermission("manage_services"),
  addService,
);
serviceRouter.patch(
  "/:id/edit",
  validate(updateServiceValidation),
  protect,
  isStaff,
  checkPermission("manage_services"),
  editService,
);
serviceRouter.post(
  "/:serviceId/options/add",
  validate(serviceAddOptionValidation),
  protect,
  isStaff,
  checkPermission("manage_services"),
  addServiceItem,
);
serviceRouter.patch(
  "/:serviceId/options/:optionId",
  validate(serviceUpdateOptionValidation),
  protect,
  isStaff,
  checkPermission("manage_services"),
  editServiceItem,
);
serviceRouter.delete(
  "/:serviceId/options/:optionId",
  validate(serviceItemIdValidation),
  protect,
  isStaff,
  checkPermission("manage_services"),
  deleteServiceItem,
);

serviceRouter.delete(
  "/:serviceId",
  protect,
  isStaff,
  checkPermission("manage_services"),
  validate(ServiceIdValidation),
  deleteService,
);

serviceRouter.get("/", validate(searchServicesValidation), getServices);

serviceRouter.get("/:serviceId", validate(ServiceIdValidation), getServiceById);

export default serviceRouter;
