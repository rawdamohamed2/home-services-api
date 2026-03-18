import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Wallet owner is required'],
        unique: true
    },

    balance: {
        type: Number,
        default: 0,
        min: [0, 'Balance cannot be negative'],
        validate: {
            validator: function(v) {
                return v >= 0;
            },
            message: 'Balance cannot be negative'
        }
    },

    currency: {
        type: String,
        default: "EGP",
        uppercase: true,
        enum: ['EGP', 'USD', 'SAR', 'AED']
    },

    isActive: {
        type: Boolean,
        default: true
    },

    lastTransactionAt: Date,

    totalCredited: {
        type: Number,
        default: 0
    },

    totalDebited: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

walletSchema.virtual('transactions', {
    ref: 'WalletTransaction',
    localField: '_id',
    foreignField: 'wallet',
    options: { sort: { createdAt: -1 } }
});

walletSchema.methods.credit = async function(amount, options = {}) {
    if (amount <= 0) throw new Error('Amount must be positive');

    this.balance += amount;
    this.totalCredited += amount;
    this.lastTransactionAt = new Date();

    await this.save();

    // إنشاء transaction
    const Transaction = mongoose.model('WalletTransaction');
    const transaction = await Transaction.create({
        wallet: this._id,
        amount,
        type: 'credit',
        source: options.source || 'wallet_topup',
        referenceId: options.referenceId,
        note: options.note,
        status: 'completed'
    });

    return { balance: this.balance, transaction };
};

// 💸 خصم رصيد
walletSchema.methods.debit = async function(amount, options = {}) {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (this.balance < amount) throw new Error('Insufficient balance');

    this.balance -= amount;
    this.totalDebited += amount;
    this.lastTransactionAt = new Date();

    await this.save();

    // إنشاء transaction
    const Transaction = mongoose.model('WalletTransaction');
    const transaction = await Transaction.create({
        wallet: this._id,
        amount,
        type: 'debit',
        source: options.source || 'withdrawal',
        referenceId: options.referenceId,
        note: options.note,
        status: 'completed'
    });

    return { balance: this.balance, transaction };
};

// ✅ التحقق من الرصيد
walletSchema.methods.hasSufficientBalance = function(amount) {
    return this.balance >= amount;
};

// 📊 إحصائيات المحفظة
walletSchema.methods.getStats = async function() {
    const Transaction = mongoose.model('WalletTransaction');

    const [totalCredit, totalDebit, lastTransactions] = await Promise.all([
        Transaction.aggregate([
            { $match: { wallet: this._id, type: 'credit', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
            { $match: { wallet: this._id, type: 'debit', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.find({ wallet: this._id })
            .sort('-createdAt')
            .limit(10)
    ]);

    return {
        balance: this.balance,
        totalCredited: totalCredit[0]?.total || 0,
        totalDebited: totalDebit[0]?.total || 0,
        recentTransactions: lastTransactions
    };
};

// 🔄 إنشاء محفظة للمستخدم الجديد
walletSchema.statics.createForUser = async function(userId) {
    const wallet = await this.create({
        owner: userId,
        balance: 0,
        currency: 'EGP',
        isActive: true
    });

    return wallet;
};

export const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
export default Wallet;