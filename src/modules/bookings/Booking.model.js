import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required']
    },

    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: [true, 'Service is required']
    },

    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    selectedOptions: [
        {
            optionId: mongoose.Schema.Types.ObjectId,
            optionName: String,
            quantity: { type: Number, default: 1 },
            unitPrice: Number, // السعر وقت الطلب
            totalPrice: Number  // quantity * unitPrice
        }
    ],

    status: {
        type: String,
        enum: {
            values: ["pending", "accepted", "in-progress", "completed", "cancelled", "refunded"],
            message: 'Invalid booking status'
        },
        default: "pending"
    },

    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },

    scheduledDate: {
        type: Date,
        required: [true, 'Scheduled date is required'],
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: 'Scheduled date must be in the future'
        }
    },

    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 hour']
    },

    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            required: [true, 'Location coordinates are required'],
            validate: {
                validator: function(value) {
                    return value.length === 2 &&
                        value[0] >= -180 && value[0] <= 180 &&
                        value[1] >= -90 && value[1] <= 90;
                },
                message: 'Invalid coordinates'
            }
        },
        address: {
            street: String,
            city: String,
            details: String
        }
    },

    totalAmount: {
        type: Number,
        required: true
    },

    notes: {
        type: String,
        maxlength: [500, 'Notes too long']
    },

    cancellationReason: String,

    timeline: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }]

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

bookingSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.timeline.push({
            status: this.status,
            timestamp: new Date(),
            note: `Status changed to ${this.status}`
        });

        if (this.status === 'completed') {
            this.completedAt = new Date();
        }
    }
    next();
});

bookingSchema.pre('save', function(next) {

    const optionsTotal = this.selectedOptions.reduce((acc, option) => {
        option.totalPrice = option.unitPrice * option.quantity;
        return acc + option.totalPrice;
    }, 0);

    this.totalAmount = optionsTotal + (this.price || 0);
    next();
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    const hoursUntilBooking = (this.scheduledDate - new Date()) / (1000 * 60 * 60);
    return ['pending', 'accepted'].includes(this.status) && hoursUntilBooking > 24;
};

bookingSchema.virtual('review', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'booking',
    justOne: true
});

bookingSchema.index({ location: "2dsphere" });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ worker: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
