import mongoose from "mongoose";

const priceOptionSchema = new mongoose.Schema({
  optionName: {
    type: String,
    required: [true, "Option name is required"],
  },
  optionType: {
    type: String,
    enum: ["fixed", "hourly", "area", "trip", "custom"],
    default: "fixed",
    required: true,
  },
  pricePerUnit: {
    type: Number,
    min: 0,
    default: 0,
  },
  description: String,
});

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      minlength: [3, "Name too short"],
      maxlength: [100, "Name too long"],
      unique: [true, "Service name is already exists"],
    },
    description: {
      type: String,
      maxlength: [500, "Description too long"],
    },
    image: {
      type: String,
      required: [true, "Service image is required"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    basePrice: {
      type: Number,
      default: 0,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    estimatedTime: {
      type: Number,
      min: [5, "Too short"],
      max: [1440, "Too long (max 24 hours)"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priceOptions: [priceOptionSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

serviceSchema.pre("save", function (next) {
  if (this.priceOptions && this.priceOptions.length > 0) {
    this.priceOptions.forEach((option) => {
      if (!option._id) {
        option._id = new mongoose.Types.ObjectId();
      }
    });
  }
  next();
});

serviceSchema.virtual("workers", {
  ref: "WorkerProfile",
  localField: "_id",
  foreignField: "services",
  count: true,
});

serviceSchema.methods.calculatePrice = function (optionIndex, selectedValue) {
  const option = this.priceOptions[optionIndex];
  if (!option) return this.basePrice;

  switch (option.optionType) {
    case "fixed":
      return option.values[0] || this.basePrice;
    case "hourly":
    case "area":
    case "trip":
      return (selectedValue || 0) * (option.pricePerUnit || 0);
    default:
      return this.basePrice;
  }
};

serviceSchema.index({ name: "text", description: "text" });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ basePrice: 1 });

const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);
export default Service;
