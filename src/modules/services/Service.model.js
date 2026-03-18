import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true,
        minlength: [3, 'Name too short'],
        maxlength: [100, 'Name too long']
    },
    description: {
        type: String,
        maxlength: [500, 'Description too long']
    },
    image: {
        type: String,
        required: [true, 'Service image is required']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, 'Category is required']
    },
    basePrice: {
        type: Number,
        default: 0,
        min: [0, 'Price cannot be negative']
    },
    estimatedTime: {
        type: Number,
        min: [5, 'Too short'],
        max: [1440, 'Too long (max 24 hours)']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priceOptions: [
        {
            optionName: {
                type: String,
                required: [true, 'Option name is required']
            },
            optionType: {
                type: String,
                enum: {
                    values: ['fixed', 'hourly', 'area', 'trip', 'custom'],
                    message: 'Invalid option type'
                },
                default: 'fixed',
                required: true
            },
            values: [{
                type: Number,
                min: 0
            }],
            pricePerUnit: {
                type: Number,
                min: 0,
                default: 0
            },
            description: String
        }
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

serviceSchema.virtual('workers', {
    ref: 'WorkerProfile',
    localField: '_id',
    foreignField: 'services',
    count: true
});

serviceSchema.methods.calculatePrice = function(optionIndex, selectedValue) {
    const option = this.priceOptions[optionIndex];
    if (!option) return this.basePrice;

    if (option.optionType === 'fixed') {
        return option.values[0];
    } else if (option.optionType === 'hourly') {
        return selectedValue * option.pricePerUnit;
    } else if (option.optionType === 'area') {
        return selectedValue * option.pricePerUnit;
    } else if (option.optionType === 'trip') {
        return selectedValue * option.pricePerUnit;
    }

    return this.basePrice;
};

serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ basePrice: 1 });

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;
