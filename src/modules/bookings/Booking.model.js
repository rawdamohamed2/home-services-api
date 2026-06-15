import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service is required"],
    },

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkerProfile",
    },

    selectedOptions: [
      {
        optionId: { type: mongoose.Schema.Types.ObjectId },
        optionName: String,
        quantity: {
          min: [0, "quantity cannot be negative"],
          type: Number,
          default: 1,
        },
        unitPrice: {
          min: [0, "Price cannot be negative"],
          type: Number,
          default: 0,
        },
        totalPrice: {
          min: [0, "Price cannot be negative"],
          type: Number,
          default: 0,
        },
      },
    ],

    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "accepted",
          "in-progress",
          "completed",
          "cancelled",
          "refunded",
          "expired",
        ],
        message: "Invalid booking status",
      },
      default: "pending",
    },

    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      default: 0,
    },

    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
      validate: {
        validator: function (value) {
          if (!this.isNew) return true;
          return value > new Date();
        },
        message: "Scheduled date must be in the future",
      },
    },

    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 hour"],
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Location coordinates are required"],
        validate: {
          validator: function (value) {
            return (
              value.length === 2 &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          },
          message: "Invalid coordinates: [longitude, latitude]",
        },
      },
      address: {
        street: String,
        city: String,
        details: String,
      },
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    notes: {
      type: String,
      maxlength: [500, "Notes too long"],
    },

    cancellationReason: String,

    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

bookingSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: `Status changed to ${this.status}`,
    });
    if (this.status === "completed") {
      this.completedAt = new Date();
    }
  }
  next();
});

bookingSchema.pre("save", async function (next) {
  try {
    const Service = mongoose.model("Service");
    const serviceData = await Service.findById(this.service);

    if (!serviceData) {
      throw new Error("Service not found");
    }

    let totalOptionsPrice = 0;

    for (let selected of this.selectedOptions) {
      const serviceOption = serviceData.priceOptions.find(
        (opt) => opt._id.toString() === selected.optionId.toString(),
      );

      if (serviceOption) {
        selected.optionName = serviceOption.optionName;
        selected.unitPrice = serviceOption.pricePerUnit;
        selected.totalPrice = selected.unitPrice * selected.quantity;
        totalOptionsPrice += selected.totalPrice;
      } else {
        throw new Error(
          `Option ${selected.optionId} not found in this service`,
        );
      }
    }

    this.price = serviceData.basePrice || 0;
    this.totalAmount = this.price + totalOptionsPrice;

    next();
  } catch (error) {
    next(error);
  }
});

bookingSchema.methods.canBeCancelled = function () {
  const hoursUntilBooking =
    (this.scheduledDate - new Date()) / (1000 * 60 * 60);
  return (
    ["pending", "accepted"].includes(this.status) && hoursUntilBooking > 24
  );
};

bookingSchema.methods.canBeRescheduled = function () {
  const hoursUntilBooking =
    (this.scheduledDate - new Date()) / (1000 * 60 * 60);
  return (
    ["pending", "accepted"].includes(this.status) && hoursUntilBooking > 24
  );
};

bookingSchema.virtual("review", {
  ref: "Review",
  localField: "_id",
  foreignField: "booking",
  justOne: true,
});

bookingSchema.index({ location: "2dsphere" });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ worker: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ status: 1 });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
