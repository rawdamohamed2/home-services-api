import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      unique: true,
      minlength: [3, "Plan name too short"],
      maxlength: [100, "Plan name too long"],
    },

    description: {
      type: String,
      maxlength: [500, "Description too long"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },

    finalPrice: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: null,
    },

    durationMonths: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 month"],
      default: 1,
    },

    features: [
      {
        type: String,
        trim: true,
      },
    ],

    isPremium: {
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

subscriptionPlanSchema.pre("save", function (next) {
  if (this.discount > 0) {
    this.finalPrice = Math.round(this.price * (1 - this.discount / 100) * 100) / 100;
  } else {
    this.finalPrice = this.price;
  }
  next();
});

subscriptionPlanSchema.virtual("subscribersCount", {
  ref: "UserSubscription",
  localField: "_id",
  foreignField: "plan",
  count: true,
});

const SubscriptionPlan =
  mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
