import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: [true, "Plan is required"],
    },

    status: {
      type: String,
      enum: {
        values: ["active", "expired"],  
        message: "Invalid subscription status",
      },
      default: "active",
    },

    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: [true, "Payment method is required"],
    },

    paymentType: {
      type: String,
      enum: ["card", "instapay"],
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: null,
    },

    renewalCount: {
      type: Number,
      default: 0,
    },

    transactionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSubscriptionSchema.methods.checkExpiry = async function () {
  if (this.status === "active" && this.endDate < new Date()) {
    this.status = "expired";
    await this.save();
  }
  return this;
};

userSubscriptionSchema.methods.isExpired = function () {
  return this.endDate < new Date();
};

userSubscriptionSchema.methods.canRenew = function () {
  return this.status === "expired";
};

userSubscriptionSchema.methods.canCancel = function () {
  return this.status === "active" && !this.isExpired();
};

userSubscriptionSchema.index({ user: 1, status: 1 });
userSubscriptionSchema.index({ plan: 1, status: 1 });
userSubscriptionSchema.index({ endDate: 1 });

const UserSubscription =
  mongoose.models.UserSubscription ||
  mongoose.model("UserSubscription", userSubscriptionSchema);

export default UserSubscription;