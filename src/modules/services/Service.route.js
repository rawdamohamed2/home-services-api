import Router from "express";
import {
    addServiceValidation,
    baseServiceValidationSchema,
    updateServiceValidation
} from "../../validation/service.validation.js";
import {validate} from "../../core/middleware/validate.js";
import {addService, editService} from "./Service.controller.js";


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


export default serviceRouter;