import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        unique: true,
        trim: true,
        enum: {
            values: ["basic", "premium", "professional", "enterprise"],
            message: 'Invalid plan name'
        }
    },
    displayName: {
        type: String,
        required: [true, 'Display name is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    currency: {
        type: String,
        default: "EGP",
        uppercase: true,
        enum: ['EGP', 'USD', 'SAR', 'AED']
    },
    description: {
        type: String,
        maxlength: [500, 'Description too long']
    },
    durationInMonths: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 month'],
        max: [12, 'Duration cannot exceed 12 months']
    },
    features: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

},{
    timestamps: true,
        toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

subscriptionPlanSchema.virtual('activeSubscriptions', {
    ref: 'Subscription',
    localField: '_id',
    foreignField: 'plan',
    match: { isActive: true },
    count: true
});

subscriptionPlanSchema.methods.getFinalPrice = function() {
    if (this.discountPercent > 0) {
        return this.price * (1 - this.discountPercent / 100);
    }
    return this.price;
};

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
