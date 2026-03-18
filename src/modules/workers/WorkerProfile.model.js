import mongoose from 'mongoose';

const workerProfileSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },

    categories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, 'At least one category is required']
        }
    ],

    experienceYears: {
        type: Number,
        default: 0,
        min: 0,
        max: 70
    },
    city:{
        type:String,
        required:[ true, "the city is required" ],
    },

    nationalIdFront: {
        type: String,
        required: [true, 'National ID front image is required']
    },

    nationalIdBack: {
        type: String,
        required: [true, 'National ID back image is required']
    },

    isApproved: {
        type: Boolean,
        default: false
    },

    approvalStatus: {
        type: String,
        enum: {
            values: ["pending", "approved", " Suspended", "rejected"],
            message: 'Invalid approval status'
        },
        default: "pending"
    },

    vehicleType: {
        type: String,
        enum: {
            values: ["truck", "van", "pickup", "none"],
            message: 'Invalid vehicle type'
        },
        default: "none"
    },

    licenseImage: String,

    ratingAverage: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot be more than 5']
    },

    completedJobs: {
        type: Number,
        default: 0
    },

    availability: [
        {
            day: {
                type: String,
                enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
            },
            from: String,
            to: String,
            isAvailable: { type: Boolean, default: true }
        }
    ],

    lastLocationUpdate: Date,

    availabilityStatus: {
        type: String,
        enum: {
            values: ["online", "offline", "busy"],
            message: 'Invalid availability status'
        },
        default: "offline"
    },

    rejectionReason: String

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

workerProfileSchema.virtual('reviews', {
    ref: 'Review',
    localField: 'user',
    foreignField: 'worker',
    count: true
});

workerProfileSchema.methods.updateRating = async function() {
    const Review = mongoose.model('Review');
    const result = await Review.aggregate([
        { $match: { worker: this.user } },
        { $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                total: { $sum: 1 }
            }}
    ]);

    if (result.length > 0) {
        this.ratingAverage = Math.round(result[0].avgRating * 10) / 10;
        this.totalRatings = result[0].total;
    } else {
        this.ratingAverage = 0;
        this.totalRatings = 0;
    }

    await this.save();
};


const Worker = mongoose.model("WorkerProfile", workerProfileSchema);
export default Worker;