import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({

    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: [true, 'Wallet is required'],
        index: true
    },

    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0'],
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Amount must be positive'
        }
    },

    type: {
        type: String,
        enum: {
            values: ["credit", "debit"],
            message: 'Invalid transaction type'
        },
        required: true
    },

    source: {
        type: String,
        enum: {
            values: [
                "booking_payment",
                "wallet_topup",
                "withdrawal",
                "refund",
                "admin_adjustment",
                "transfer",
                "commission",
                "bonus"
            ],
            message: 'Invalid source'
        },
        required: [true, 'Transaction source is required']
    },

    status: {
        type: String,
        enum: {
            values: ["pending", "completed", "failed", "cancelled"],
            message: 'Invalid status'
        },
        default: "pending"
    },

    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceModel'  // Dynamic reference
    },

    referenceModel: {
        type: String,
        enum: ['Booking', 'Withdrawal', 'Payment']
    },

    balanceBefore: Number,
    balanceAfter: Number,

    note: {
        type: String,
        maxlength: [200, 'Note too long']
    },

    metadata: {
        ip: String,
        userAgent: String
    },

    completedAt: Date,
    failedReason: String

}, { timestamps: true });

walletTransactionSchema.pre('save', async function(next) {
    if (this.isNew) {
        const Wallet = mongoose.model('Wallet');
        const wallet = await Wallet.findById(this.wallet);

        if (wallet) {
            this.balanceBefore = wallet.balance;

            if (this.type === 'credit') {
                this.balanceAfter = wallet.balance + this.amount;
            } else if (this.type === 'debit') {
                this.balanceAfter = wallet.balance - this.amount;
            }
        }
    }

    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }

    next();
});


walletTransactionSchema.post('save', async function() {
    if (this.status === 'completed') {
        const Wallet = mongoose.model('Wallet');
        await Wallet.findByIdAndUpdate(this.wallet, {
            lastTransactionAt: new Date()
        });
    }
});



walletTransactionSchema.index({ referenceId: 1, referenceModel: 1 });
walletTransactionSchema.index({ status: 1, createdAt: 1 });
walletTransactionSchema.index({ source: 1, createdAt: -1 });
module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);