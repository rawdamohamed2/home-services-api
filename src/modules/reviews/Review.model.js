import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: [true, 'Booking is required'],
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // تعديل
        required: [true, 'User is required']
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Worker is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        validate: {
            validator: function(v) {
                return Number.isInteger(v * 10);
            },
            message: 'Rating can be whole or half numbers'
        }
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [300, 'Comment cannot exceed 300 characters'],
        default: ""
    },
    verified: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



reviewSchema.index({ worker: 1, rating: -1 });
reviewSchema.index({ worker: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

reviewSchema.post('save', async function() {

    const WorkerProfile = mongoose.model('WorkerProfile');
    const workerProfile = await WorkerProfile.findOne({ user: this.worker });

    if (workerProfile) {
        await workerProfile.updateRating();
    }
});

// Middleware بعد مسح التقييم
reviewSchema.post('remove', async function() {
    const WorkerProfile = mongoose.model('WorkerProfile');
    const workerProfile = await WorkerProfile.findOne({ user: this.worker });

    if (workerProfile) {
        await workerProfile.updateRating();
    }
});

// Method للتحقق من أن المستخدم صاحب الحجز
reviewSchema.methods.isBookingOwner = function(userId) {
    return this.user.toString() === userId.toString();
};

// Method لزيادة عدد المفيد
reviewSchema.methods.markHelpful = async function(userId) {
    if (!this.helpfulBy.includes(userId)) {
        this.helpfulBy.push(userId);
        this.helpful = this.helpfulBy.length;
        await this.save();
    }
    return this.helpful;
};

// Static method لجلب تقييمات عامل معين
reviewSchema.statics.getWorkerReviews = async function(workerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        this.find({ worker: workerId })
            .populate('user', 'fullName profileImage')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit),
        this.countDocuments({ worker: workerId })
    ]);

    return {
        reviews,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};


reviewSchema.statics.getRatingStats = async function(workerId) {
    const stats = await this.aggregate([
        { $match: { worker: mongoose.Types.ObjectId(workerId) } },
        { $group: {
                _id: null,
                average: { $avg: '$rating' },
                total: { $sum: 1 },
                fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                fourStar: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
                threeStar: { $sum: { $cond: [{ $gte: ['$rating', 3] }, 1, 0] } },
                twoStar: { $sum: { $cond: [{ $gte: ['$rating', 2] }, 1, 0] } },
                oneStar: { $sum: { $cond: [{ $gte: ['$rating', 1] }, 1, 0] } }
            }}
    ]);

    return stats[0] || { average: 0, total: 0 };
};

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
