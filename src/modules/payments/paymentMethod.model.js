import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },

    ownerType: {
      type: String,
      enum: ["user", "worker"],
      required: true,
    },

    type: {
      type: String,
      enum: {
        values: ["card", "instapay"],
        message: "Invalid payment method type",
      },
      required: true,
    },

    cardholderName: {
      type: String,
      trim: true,
    },

    last4Digits: {
      type: String,
      match: [/^\d{4}$/, "Last 4 digits must be exactly 4 numbers"],
    },

    cardBrand: {
      type: String,
      enum: ["Visa", "Mastercard", "Unknown"],
      default: "Unknown",
    },

    expiryMonth: {
      type: String,
      match: [/^(0[1-9]|1[0-2])$/, "Invalid expiry month (MM)"],
    },

    expiryYear: {
      type: String,
      match: [/^\d{2}$/, "Invalid expiry year (YY)"],
    },

    cardToken: {
      type: String,
      select: false, 
    },

    instapayId: {
      type: String,
      trim: true,
    },

    accountHolderName: {
      type: String,
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentMethodSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { owner: this.owner, ownerType: this.ownerType, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

paymentMethodSchema.methods.detectCardBrand = function (cardNumber) {
  if (!cardNumber) return "Unknown";
  const firstDigit = cardNumber.toString()[0];
  if (firstDigit === "4") return "Visa";
  if (firstDigit === "5") return "Mastercard";
  return "Unknown";
};

paymentMethodSchema.index({ owner: 1, ownerType: 1, isDefault: -1 });
paymentMethodSchema.index({ owner: 1, type: 1 });

const PaymentMethod =
  mongoose.models.PaymentMethod ||
  mongoose.model("PaymentMethod", paymentMethodSchema);
export default PaymentMethod;