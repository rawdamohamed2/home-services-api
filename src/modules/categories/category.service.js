import Category from './Category.model.js';
import mongoose from 'mongoose';

export const createCategory = async (data) => {
    const { name, isActive } = data;
    
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
        throw new Error('Category with this name already exists');
    }
    
    const category = new Category({
        name,
        isActive: isActive !== undefined ? isActive : true
    });
    
    await category.save();
    return category;
};

export const getAllCategories = async (filters) => {
    const { page = 1, limit = 10, isActive, search } = filters;
    
    const query = {};
    
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }
    
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [categories, total] = await Promise.all([
        Category.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Category.countDocuments(query)
    ]);
    
    return {
        categories,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
};

export const getCategoryById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid category ID format');
    }
    
    const category = await Category.findById(id).lean();
    if (!category) {
        throw new Error('Category not found');
    }
    
    return category;
};

export const updateCategory = async (id, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid category ID format');
    }
    
    const { name, isActive } = updateData;
    
    if (name) {
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            _id: { $ne: id }
        });
        if (existingCategory) {
            throw new Error('Category with this name already exists');
        }
    }
    
    const category = await Category.findByIdAndUpdate(
        id,
        { ...(name && { name }), ...(isActive !== undefined && { isActive }) },
        { new: true, runValidators: true }
    );
    
    if (!category) {
        throw new Error('Category not found');
    }
    
    return category;
};

export const deleteCategory = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid category ID format');
    }
    
    const Service = mongoose.model('Service');
    const servicesCount = await Service.countDocuments({ category: id });
    
    if (servicesCount > 0) {
        throw new Error(`Cannot delete category with ${servicesCount} associated services. Please reassign or delete services first.`);
    }
    
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
        throw new Error('Category not found');
    }
    
    return { message: 'Category deleted successfully', deletedCategory: category };
};

export const toggleCategoryStatus = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid category ID format');
    }
    
    const category = await Category.findById(id);
    if (!category) {
        throw new Error('Category not found');
    }
    
    category.isActive = !category.isActive;
    await category.save();
    
    return category;
};