import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Worker is required"],
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: [true, "Wallet is required"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [10, "Minimum withdrawal amount is 10 EGP"],
    },

    method: {
      type: String,
      enum: {
        values: ["visa", "instapay"],
        message: "Invalid withdrawal method",
      },
      required: true,
    },

    methodDetails: {
      // Visa
      cardholderName: String,
      last4Digits: String,
      cardBrand: String,

      // InstaPay
      instapayId: String,
      accountHolderName: String,
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "paid"],
        message: "Invalid status",
      },
      default: "pending",
    },

    adminNotes: String,
    rejectionReason: String,

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,

    transactionReference: String,

    paidAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

withdrawalSchema.post("save", async function () {
  if (this.isModified && this.status === "approved" && !this._debitDone) {
  }
});

// Approve method
withdrawalSchema.methods.approve = async function (adminId) {
  if (this.status !== "pending") {
    throw new Error("Withdrawal already processed");
  }

  const Wallet = mongoose.model("Wallet");
  const wallet = await Wallet.findById(this.wallet);

  if (!wallet || wallet.balance < this.amount) {
    throw new Error("Insufficient balance");
  }

  this.status = "approved";
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  await this.save();

  await wallet.debit(this.amount, {
    source: "withdrawal",
    referenceId: this._id,
    referenceModel: "Withdrawal",
    note: `Withdrawal approved #${this._id}`,
  });

  return this;
};

// Reject method
withdrawalSchema.methods.reject = async function (adminId, reason) {
  if (this.status !== "pending") {
    throw new Error("Withdrawal already processed");
  }

  this.status = "rejected";
  this.rejectionReason = reason;
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  await this.save();

  return this;
};

withdrawalSchema.index({ worker: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: 1 });
withdrawalSchema.index({ wallet: 1 });

const Withdrawal =
  mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
export default Withdrawal;