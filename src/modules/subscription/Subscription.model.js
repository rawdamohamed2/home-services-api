import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required'],
        index: true
    },

    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
        required: [true, 'Plan is required']
    },

    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        default: Date.now
    },

    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },

    isActive: {
        type: Boolean,
        default: true
    },

    status: {
        type: String,
        enum: {
            values: ['active', 'expired', 'cancelled', 'pending'],
            message: 'Invalid subscription status'
        },
        default: 'active'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'wallet', 'cash'],
        required: true
    },
    cancelledAt: Date,
    cancellationReason: String,
    transactions: [{
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WalletTransaction'
        },
        amount: Number,
        date: Date,
        status: String
    }],
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

subscriptionSchema.index({ user: 1, isActive: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ plan: 1, isActive: 1 });

subscriptionSchema.virtual('daysRemaining').get(function() {
    if (!this.endDate) return 0;
    const remaining = Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
    return remaining > 0 ? remaining : 0;
});

subscriptionSchema.virtual('isExpired').get(function() {
    return this.endDate < new Date();
});

subscriptionSchema.pre('save', function(next) {
    // تحديث الحالة تلقائياً بناءً على endDate
    if (this.endDate < new Date() && this.status === 'active') {
        this.status = 'expired';
        this.isActive = false;
    }
    next();
});

// Method لإلغاء الاشتراك
subscriptionSchema.methods.cancel = async function(reason) {
    this.isActive = false;
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    await this.save();
    return this;
};

// Method للتجديد
subscriptionSchema.methods.renew = async function() {
    const plan = await mongoose.model('SubscriptionPlan').findById(this.plan);

    // حساب التواريخ الجديدة
    const newStartDate = this.endDate;
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + plan.durationInMonths);

    // إنشاء اشتراك جديد
    const Subscription = mongoose.model('Subscription');
    const newSubscription = await Subscription.create({
        user: this.user,
        plan: this.plan,
        startDate: newStartDate,
        endDate: newEndDate,
        price: plan.price,
        paymentMethod: this.paymentMethod,
        autoRenew: this.autoRenew,
        renewalCount: this.renewalCount + 1
    });

    // تحديث الاشتراك القديم
    this.isActive = false;
    this.status = 'expired';
    await this.save();

    return newSubscription;
};

// Method للتحقق من الصلاحية
subscriptionSchema.methods.checkBenefits = function() {
    return {
        isActive: this.isActive && !this.isExpired,
        daysRemaining: this.daysRemaining,
        plan: this.plan
    };
};

// Static method للاشتراكات المنتهية
subscriptionSchema.statics.getExpiredSubscriptions = async function() {
    return await this.find({
        endDate: { $lt: new Date() },
        status: 'active',
        isActive: true
    }).populate('user plan');
};

// Static method للاشتراكات على وشك الانتهاء
subscriptionSchema.statics.getExpiringSoon = async function(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.find({
        endDate: {
            $gte: new Date(),
            $lte: futureDate
        },
        status: 'active',
        isActive: true,
        autoRenew: false
    }).populate('user plan');
};
module.exports = mongoose.model("Subscription", subscriptionSchema);
