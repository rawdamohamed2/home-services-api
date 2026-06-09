import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required']
    },

    type: {
        type: String,
        enum: {
            values: ["card", "instapay", "bank_account", "vodafone_cash"],
            message: 'Invalid payment method type'
        },
        required: true
    },

    provider: {
        type: String,
        enum: ['Visa', 'Mastercard', 'Mada', 'American Express']
    },

    last4Digits: {
        type: String,
        match: [/^\d{4}$/, 'Last 4 digits must be 4 numbers']
    },
    cardBrand: String,
    expiryMonth: String,
    expiryYear: String,
    cardToken: String,

    instapayNumber: {
        type: String,
        match: [/^[\d@]+$/, 'Invalid instapay number']
    },

    bankName: String,
    accountNumber: String,
    accountName: String,
    iban: String,

    phoneNumber: {
        type: String,
        match: [/^01[0125][0-9]{8}$/, 'Invalid phone number']
    },
    isDefault: {
        type: Boolean,
        default: false
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verifiedAt: Date

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

paymentMethodSchema.index({ user: 1, isDefault: -1 });
paymentMethodSchema.index({ user: 1, type: 1 });

paymentMethodSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);