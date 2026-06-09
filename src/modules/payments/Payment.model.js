import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({

    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        unique: true,
        sparse: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required']
    },

    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Worker is required']
    },

    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },

    fee: {
        type: Number,
        default: 0,
        min: 0
    },

    netAmount: {
        type: Number,
        default: function() {
            return this.amount - this.fee;
        }
    },

    paymentMethod: {
        type: String,
        enum: {
            values: ["card", "instapay", "cash", "wallet", "apple_pay"],
            message: 'Invalid payment method'
        },
        required: [true, 'Payment method is required']
    },

    status: {
        type: String,
        enum: {
            values: [
                "pending",
                "pending_verification",
                "paid",
                "failed",
                "refunded",
                "partially_refunded"
            ],
            message: 'Invalid payment status'
        },
        default: "pending"
    },

    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },

    paymentProofImage: String,

    approvedByAdmin: {
        type: Boolean,
        default: false
    },

    approvedAt: Date,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    releasedToWorker: {
        type: Boolean,
        default: false
    },
    releasedAt: Date,

    refundReason: String,
    refundedAt: Date

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ worker: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: 1 });
paymentSchema.index({ transactionId: 1 });

paymentSchema.virtual('walletTransaction', {
    ref: 'WalletTransaction',
    localField: '_id',
    foreignField: 'referenceId',
    justOne: true
});

module.exports = mongoose.model("Payment", paymentSchema);
