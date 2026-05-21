import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: [true, "Wallet is required"],
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    type: {
      type: String,
      enum: {
        values: ["credit", "debit"],
        message: "Invalid transaction type",
      },
      required: true,
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
          "commission",         
          "booking_commission", 
        ],
        message: "Invalid source",
      },
      required: [true, "Transaction source is required"],
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed", "cancelled"],
        message: "Invalid status",
      },
      default: "pending",
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
    },

    referenceModel: {
      type: String,
      enum: ["Booking", "Withdrawal", "Payment"],
    },

    balanceBefore: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },

    note: {
      type: String,
      maxlength: [200, "Note too long"],
    },

    completedAt: Date,
    failedReason: String,
  },
  { timestamps: true }
);

walletTransactionSchema.pre("save", async function (next) {
  if (this.isNew && this.status === "completed") {
    const Wallet = mongoose.model("Wallet");
    const wallet = await Wallet.findById(this.wallet);
    if (wallet) {
      this.balanceBefore = wallet.balance;
      this.balanceAfter =
        this.type === "credit"
          ? wallet.balance + this.amount
          : wallet.balance - this.amount;
    }
  }

  if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});

walletTransactionSchema.index({ referenceId: 1, referenceModel: 1 });
walletTransactionSchema.index({ status: 1, createdAt: 1 });
walletTransactionSchema.index({ source: 1, createdAt: -1 });
walletTransactionSchema.index({ wallet: 1, createdAt: -1 });

const WalletTransaction =
  mongoose.models.WalletTransaction ||
  mongoose.model("WalletTransaction", walletTransactionSchema);
export default WalletTransaction;