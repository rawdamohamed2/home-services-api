import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Wallet owner is required"],
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },

    pendingEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "EGP",
      uppercase: true,
      enum: ["EGP"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastTransactionAt: Date,

    totalCredited: {
      type: Number,
      default: 0,
    },

    totalDebited: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

walletSchema.virtual("transactions", {
  ref: "WalletTransaction",
  localField: "_id",
  foreignField: "wallet",
  options: { sort: { createdAt: -1 } },
});

walletSchema.methods.credit = async function (amount, options = {}) {
  if (amount <= 0) throw new Error("Amount must be positive");

  this.balance += amount;
  this.totalCredited += amount;
  this.lastTransactionAt = new Date();
  await this.save();

  const Transaction = mongoose.model("WalletTransaction");
  const transaction = await Transaction.create({
    wallet: this._id,
    amount,
    type: "credit",
    source: options.source || "wallet_topup",
    referenceId: options.referenceId,
    referenceModel: options.referenceModel,
    note: options.note || null,
    status: "completed",
  });

  return { balance: this.balance, transaction };
};

walletSchema.methods.debit = async function (amount, options = {}) {
  if (amount <= 0) throw new Error("Amount must be positive");
  if (this.balance < amount) throw new Error("Insufficient balance");

  this.balance -= amount;
  this.totalDebited += amount;
  this.lastTransactionAt = new Date();
  await this.save();

  const Transaction = mongoose.model("WalletTransaction");
  const transaction = await Transaction.create({
    wallet: this._id,
    amount,
    type: "debit",
    source: options.source || "withdrawal",
    referenceId: options.referenceId,
    referenceModel: options.referenceModel,
    note: options.note || null,
    status: "completed",
  });

  return { balance: this.balance, transaction };
};

walletSchema.methods.addPendingEarnings = async function (amount, options = {}) {
  if (amount <= 0) throw new Error("Amount must be positive");

  this.pendingEarnings += amount;
  await this.save();

  const Transaction = mongoose.model("WalletTransaction");
  await Transaction.create({
    wallet: this._id,
    amount,
    type: "credit",
    source: "booking_payment",
    referenceId: options.referenceId,
    referenceModel: "Booking",
    note: options.note || "Pending earnings from booking",
    status: "pending",
  });
};

walletSchema.methods.releasePendingEarnings = async function (amount, options = {}) {
  if (amount > this.pendingEarnings) throw new Error("Amount exceeds pending earnings");

  this.pendingEarnings -= amount;
  this.balance += amount;
  this.totalCredited += amount;
  this.lastTransactionAt = new Date();
  await this.save();

  const Transaction = mongoose.model("WalletTransaction");
  await Transaction.create({
    wallet: this._id,
    amount,
    type: "credit",
    source: "booking_payment",
    referenceId: options.referenceId,
    referenceModel: "Payment",
    note: options.note || "Earnings released to balance",
    status: "completed",
  });
};

walletSchema.methods.hasSufficientBalance = function (amount) {
  return this.balance >= amount;
};

walletSchema.statics.createForUser = async function (userId) {
  return await this.create({
    owner: userId,
    balance: 0,
    pendingEarnings: 0,
    currency: "EGP",
    isActive: true,
  });
};

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
export default Wallet;