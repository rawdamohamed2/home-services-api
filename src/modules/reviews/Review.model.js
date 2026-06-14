import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
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

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
    },

    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      default: null,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment too long"],
      default: null,
    },

    isHiddenByWorker: {
      type: Boolean,
      default: false,
    },

    isRemovedByAdmin: {
      type: Boolean,
      default: false,
    },

    removalReason: {
      type: String,
      default: null,
    },

    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ worker: 1, createdAt: -1 });
reviewSchema.index({ user: 1, worker: 1 });

reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

reviewSchema.statics.calculateAverageRating = async function (workerId) {
  const result = await this.aggregate([
    {
      $match: {
        worker: new mongoose.Types.ObjectId(workerId),
        isRemovedByAdmin: false,
        rating: { $ne: null },
      },
    },
    {
      $group: {
        _id:          null,
        avgRating:    { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    return {
      ratingAverage: Math.round(result[0].avgRating * 10) / 10,
      totalRatings:  result[0].totalRatings,
    };
  }
  return { ratingAverage: 0, totalRatings: 0 };
};


reviewSchema.post("save", async function () {
  const WorkerProfile = mongoose.model("WorkerProfile");
  const { ratingAverage, totalRatings } = await this.constructor.calculateAverageRating(this.worker);
  await WorkerProfile.findByIdAndUpdate(this.worker, { ratingAverage, totalRatings });
});

reviewSchema.post(["findOneAndUpdate", "findOneAndDelete"], async function (doc) {
  if (!doc) return;
  const WorkerProfile = mongoose.model("WorkerProfile");
  const { ratingAverage, totalRatings } = await doc.constructor.calculateAverageRating(doc.worker);
  await WorkerProfile.findByIdAndUpdate(doc.worker, { ratingAverage, totalRatings });
});

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
