import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      unique: true,
      sparse: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkerProfile",
      required: [true, "Worker is required"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    workerEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: {
        values: ["card", "instapay", "cash"],
        message: "Invalid payment method",
      },
      required: [true, "Payment method is required"],
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
        ],
        message: "Invalid payment status",
      },
      default: "pending",
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    paymentProofImage: {
      type: String,
      default: null,
    },

    aiVerificationResult: {
    isValid:        { type: Boolean, default: null },
    keywordsFound:  { type: [String], default: [] },
    extractedText:  { type: String, default: null },
    detectedAmount: { type: Number, default: null },
    rawResponse:    { type: mongoose.Schema.Types.Mixed, default: null },
  },

    approvedByAdmin: {
      type: Boolean,
      default: false,
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    releasedToWorker: {
      type: Boolean,
      default: false,
    },
    releasedAt: Date,

    refundReason: String,
    refundedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.pre("save", function (next) {
  if (this.isNew && !this.transactionId) {
    this.transactionId =
      "TXN" +
      Date.now().toString() +
      Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  if (this.isModified("amount")) {
    this.platformFee = Math.round(this.amount * 0.1 * 100) / 100; // 10%
    this.workerEarnings = Math.round((this.amount - this.platformFee) * 100) / 100;
  }

  next();
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ worker: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;