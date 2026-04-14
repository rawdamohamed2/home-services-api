import ApiResponse from '../../core/utils/ApiResponse.js';
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
} from './category.service.js';

export const addCategory = async (req, res) => {
    try {
        const category = await createCategory(req.body);
        return ApiResponse.success(res, category, 'Category created successfully', 201);
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

export const getCategories = async (req, res) => {
    try {
        const result = await getAllCategories(req.query);
        return ApiResponse.success(res, result, 'Categories fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

export const getCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await getCategoryById(id);
        return ApiResponse.success(res, category, 'Category fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

export const updateCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await updateCategory(id, req.body);
        return ApiResponse.success(res, category, 'Category updated successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

export const deleteCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteCategory(id);
        return ApiResponse.success(res, result, 'Category deleted successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await toggleCategoryStatus(id);
        return ApiResponse.success(res, category, `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};