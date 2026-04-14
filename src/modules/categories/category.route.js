import { Router } from 'express';
import {
    addCategory,
    getCategories,
    getCategory,
    updateCategoryById,
    deleteCategoryById,
    toggleStatus
} from './category.controller.js';
import { protect } from '../../core/middleware/authMiddleware.js';
import { authorize } from '../../core/middleware/roleMiddleware.js';
import { validate } from '../../core/middleware/validate.js';
import {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,
    getCategoriesSchema
} from '../../validation/category.validation.js';  

const categoryRouter = Router();

// Public Routes
categoryRouter.get('/', validate(getCategoriesSchema), getCategories);
categoryRouter.get('/:id', validate(categoryIdSchema), getCategory);

// Admin Only Routes
categoryRouter.post('/',
    protect,
    authorize('admin', 'owner'),
    validate(createCategorySchema),
    addCategory
);

categoryRouter.patch('/:id',
    protect,
    authorize('admin', 'owner'),
    validate(updateCategorySchema),
    updateCategoryById
);

categoryRouter.patch('/:id/toggle-status',
    protect,
    authorize('admin', 'owner'),
    validate(categoryIdSchema),
    toggleStatus
);

categoryRouter.delete('/:id',
    protect,
    authorize('admin', 'owner'),
    validate(categoryIdSchema),
    deleteCategoryById
);

export default categoryRouter;