import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Name too short'],
        maxlength: [50, 'Name too long']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

categorySchema.virtual('services', {
    ref: 'Service',
    localField: '_id',
    foreignField: 'category',
    count: true
});

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
export default Category;
