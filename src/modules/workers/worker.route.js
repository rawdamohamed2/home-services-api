import Router from "express";
import {
    getAllWorkers,
    getWorkerById,
    updateWorkerProfile,
    updateAvailability,
    getMe,
    updateLocation,
    toggleStatus,
    getMyAssignments,
    getMyBookings,
    getMyReviews,
    uploadWorkerPhoto,
    deleteWorkerPhoto
} from "./worker.controller.js";
import {protect} from "../../core/middleware/authMiddleware.js";
import {authorize} from "../../core/middleware/roleMiddleware.js";
import {validate} from "../../core/middleware/validate.js";
import {
    availabilityStatusSchema,
    availabilityWorkerSchema,
    getWorkerByIdSchema, LocationWorkerSchema,
    updateWorkerSchema,
    uploadWorkerPhotoSchema, workerBookingSchema,
    workerSearchSchema
} from "../../validation/worker.validation.js";

const workerRouter = Router();


workerRouter.get('/assignments',
    protect,
    authorize('worker'),
    getMyAssignments
);
workerRouter.patch('/update-me',
    protect,
    authorize('worker'),
    validate(updateWorkerSchema),
    updateWorkerProfile
);
workerRouter.get('/my-reviews',
    protect,
    authorize('worker'),
    getMyReviews
);
workerRouter.patch('/location',
    protect,
    authorize('worker'),
    validate(LocationWorkerSchema),
    updateLocation
);
workerRouter.patch('/availability',
    protect,
    authorize('worker'),
    validate(availabilityWorkerSchema),
    updateAvailability
);
workerRouter.patch('/status',
    protect,
    authorize('worker'),
    validate(availabilityStatusSchema),
    toggleStatus
);

workerRouter.get('/bookings',
    protect,
    authorize('worker'),
    validate(workerBookingSchema),
    getMyBookings
);

workerRouter.post('/profileImage',
    protect,
    authorize('worker'),
    validate(uploadWorkerPhotoSchema),
    uploadWorkerPhoto
);
workerRouter.delete('/profileImage',
    protect,
    authorize('worker'),
    deleteWorkerPhoto
);

workerRouter.get('/me',
    protect,
    authorize('worker'),
    getMe
);
workerRouter.get('/:id',
    validate(getWorkerByIdSchema),
    getWorkerById);

workerRouter.get('/',
    validate(workerSearchSchema),
    getAllWorkers
);
export default workerRouter;