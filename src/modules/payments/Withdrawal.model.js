import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({

    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Worker is required']
    },

    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: [true, 'Wallet is required']
    },

    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [10, 'Minimum withdrawal amount is 10']
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

    method: {
        type: String,
        enum: {
            values: ["bank", "instapay", "vodafone_cash", "wallet"],
            message: 'Invalid withdrawal method'
        },
        required: true
    },

    accountDetails: {
        type: String,
        required: [true, 'Account details are required']
    },

    bankName: String,
    accountNumber: String,
    instapayNumber: String,
    phoneNumber: String,

    status: {
        type: String,
        enum: {
            values: ["pending", "processing", "approved", "rejected", "paid", "failed"],
            message: 'Invalid status'
        },
        default: "pending"
    },

    adminNotes: String,

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    approvedAt: Date,

    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    processedAt: Date,

    transactionReference: String, // رقم التحويل
    rejectionReason: String

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

withdrawalSchema.index({ worker: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: 1 });
withdrawalSchema.index({ wallet: 1 });

withdrawalSchema.post('save', async function() {
    if (this.status === 'approved') {
        // خصم الرصيد من المحفظة
        const Wallet = mongoose.model('Wallet');
        const wallet = await Wallet.findById(this.wallet);

        await wallet.debit(this.amount, {
            source: 'withdrawal',
            referenceId: this._id,
            note: `Withdrawal #${this._id}`
        });
    }
});

// Method للموافقة على السحب
withdrawalSchema.methods.approve = async function(adminId) {
    if (this.status !== 'pending') {
        throw new Error('Withdrawal already processed');
    }

    const Wallet = mongoose.model('Wallet');
    const wallet = await Wallet.findById(this.wallet);

    // التأكد من وجود رصيد كافي
    if (wallet.balance < this.amount) {
        throw new Error('Insufficient balance');
    }

    this.status = 'approved';
    this.approvedBy = adminId;
    this.approvedAt = new Date();
    await this.save();

    return this;
};

// Method لرفض السحب
withdrawalSchema.methods.reject = async function(adminId, reason) {
    this.status = 'rejected';
    this.rejectionReason = reason;
    this.approvedBy = adminId;
    this.approvedAt = new Date();
    await this.save();

    return this;
};

module.exports = mongoose.model("Withdrawal", withdrawalSchema);