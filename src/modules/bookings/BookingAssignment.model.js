import mongoose from 'mongoose';

const bookingAssignmentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: [true, 'Booking is required']
    },

    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Worker is required']
    },

    status: {
        type: String,
        enum: {
            values: ["pending", "sent", "viewed", "accepted", "rejected", "expired"],
            message: 'Invalid assignment status'
        },
        default: "pending"
    },

    assignedAt: {
        type: Date,
        default: Date.now
    },

    viewedAt: Date,
    respondedAt: Date,

    expiryTime: {
        type: Date,
        default: () => new Date(+new Date() + 30*60*1000) // 30 دقيقة من الآن
    },

    responseNote: String,

    priority: {
        type: Number,
        default: 1, // 1 = عادي, 2 = مرتفع
        min: 1,
        max: 3
    },

    assignmentOrder: {
        type: Number, // ترتيب الإرسال (1,2,3)
        default: 1
    }

}, {
    timestamps: true
});

bookingAssignmentSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        if (this.status === 'viewed') {
            this.viewedAt = new Date();
        } else if (this.status === 'accepted' || this.status === 'rejected') {
            this.respondedAt = new Date();
        }
    }
    next();
});

bookingAssignmentSchema.methods.isValid = function() {
    return this.status === 'sent' &&
        this.expiryTime > new Date() &&
        !this.respondedAt;
};

bookingAssignmentSchema.index({ worker: 1, status: 1 });
bookingAssignmentSchema.index({ booking: 1, status: 1 });
bookingAssignmentSchema.index({ expiryTime: 1 });
bookingAssignmentSchema.index({ status: 1, assignedAt: -1 });
bookingAssignmentSchema.index({ booking: 1, worker: 1 }, { unique: true });

bookingAssignmentSchema.methods.isValid = function() {
    return ['sent', 'viewed'].includes(this.status) &&
        this.expiryTime > new Date() &&
        !this.respondedAt;
};

bookingAssignmentSchema.methods.accept = async function() {
    if (!this.isValid()) {
        throw new Error('Assignment expired or already responded');
    }

    const Booking = mongoose.model('Booking');
    const Assignment = mongoose.model('BookingAssignment');

    // Reject other assignments for this booking
    await Assignment.updateMany(
        {
            booking: this.booking,
            _id: { $ne: this._id },
            status: { $in: ['sent', 'viewed'] }
        },
        {
            status: 'rejected',
            respondedAt: new Date(),
            responseNote: 'Another worker accepted this booking'
        }
    );

    // Update booking
    await Booking.findByIdAndUpdate(this.booking, {
        worker: this.worker,
        status: 'accepted'
    });

    this.status = 'accepted';
    this.respondedAt = new Date();
    await this.save();

    return this;
};

bookingAssignmentSchema.methods.reject = async function(reason) {
    if (!['sent', 'viewed'].includes(this.status)) {
        throw new Error('Cannot reject this assignment');
    }

    this.status = 'rejected';
    this.respondedAt = new Date();
    if (reason) this.responseNote = reason;
    await this.save();

    return this;
};

bookingAssignmentSchema.virtual('timeLeft').get(function() {
    return Math.max(0, this.expiryTime - new Date());
});
// Statics
bookingAssignmentSchema.statics.sendToWorkers = async function(bookingId, workerIds, priority = 1) {
    const assignments = workerIds.map((workerId, index) => ({
        booking: bookingId,
        worker: workerId,
        status: 'sent',
        priority,
        assignmentOrder: index + 1,
        expiryTime: new Date(Date.now() + 30 * 60 * 1000)
    }));

    return await this.insertMany(assignments);
};

const BookingAssignment = mongoose.models.BookingAssignment ||
    mongoose.model('BookingAssignment', bookingAssignmentSchema);
export default BookingAssignment;

