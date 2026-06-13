import mongoose from "mongoose";

const commentReportSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: [true, "Review is required"],
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },

    commentAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment author is required"],
    },

    reason: {
      type: String,
      enum: {
        values: [
          "spam_or_misleading",
          "offensive_or_abusive",
          "fake_review",
          "other",
        ],
        message: "Invalid report reason",
      },
      required: [true, "Reason is required"],
    },

    otherReason: {
      type: String,
      maxlength: [300, "Reason too long"],
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "ignored", "comment_removed", "user_muted"],
        message: "Invalid report status",
      },
      default: "pending",
    },

    adminNotes: {
      type: String,
      maxlength: [500, "Notes too long"],
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentReportSchema.pre("validate", function (next) {
  if (this.reason === "other" && !this.otherReason) {
    this.invalidate("otherReason", "Please specify the reason");
  }
  next();
});

commentReportSchema.index({ status: 1, createdAt: -1 });
commentReportSchema.index({ review: 1 });
commentReportSchema.index({ commentAuthor: 1 });

const CommentReport =
  mongoose.models.CommentReport ||
  mongoose.model("CommentReport", commentReportSchema);

export default CommentReport;
