import Router from "express";
import {
    addServiceValidation,
    searchServicesValidation,
    serviceAddOptionValidation, ServiceIdValidation, serviceItemIdValidation, ServiceItemQuantityValidation,
    serviceUpdateOptionValidation,
    updateServiceValidation
} from "../../validation/service.validation.js";
import {validate} from "../../core/middleware/validate.js";
import {
    addService,
    addServiceItem, deleteService,
    deleteServiceItem,
    editService,
    editServiceItem,
    getServiceById,
    getServices,
} from "./Service.controller.js";


const serviceRouter = Router();

serviceRouter.post(
    '/add',
    validate(addServiceValidation),
    addService
);
serviceRouter.patch(
    '/edit/:id',
    validate(updateServiceValidation),
    editService
);
serviceRouter.post(
    '/:serviceId/options/add',
    validate(serviceAddOptionValidation),
    addServiceItem
);
serviceRouter.patch(
    '/:serviceId/options/:optionId',
    validate(serviceUpdateOptionValidation),
    editServiceItem
);
serviceRouter.delete(
    '/:serviceId/options/:optionId',
    validate(serviceItemIdValidation),
    deleteServiceItem
);

serviceRouter.delete(
    '/:serviceId',
    validate(ServiceIdValidation),
    deleteService
);

serviceRouter.get(
    '/',
    validate(searchServicesValidation),
    getServices
);

serviceRouter.get(
    '/:serviceId',
    validate(ServiceIdValidation),
    getServiceById
);

export default serviceRouter;