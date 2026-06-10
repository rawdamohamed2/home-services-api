import mongoose from "mongoose";

const bookingAssignmentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
    },

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkerProfile",
      required: [true, "Worker is required"],
    },

    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "sent",
          "viewed",
          "accepted",
          "rejected",
          "countered",
          "user_accepted",
          "user_rejected",
          "expired",
        ],
        message: "Invalid assignment status",
      },
      default: "pending",
    },

    assignedAt: { type: Date, default: Date.now },
    viewedAt: Date,
    respondedAt: Date,

    expiryTime: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },

    responseNote: String,

    originalPrice: { type: Number, default: null },
    counterPrice: { type: Number, default: null },
    counterNote: { type: String, default: null },
    finalPrice: { type: Number, default: null },

    userRespondedAt: Date,

    priority: { type: Number, default: 1, min: 1, max: 3 },
    assignmentOrder: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// ── Middleware ────────────────────────────────────────────────────────────────
bookingAssignmentSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "viewed") {
      this.viewedAt = new Date();
    } else if (["accepted", "rejected", "countered"].includes(this.status)) {
      this.respondedAt = new Date();
    } else if (["user_accepted", "user_rejected"].includes(this.status)) {
      this.userRespondedAt = new Date();
    }
  }
  next();
});

// ── Methods ───────────────────────────────────────────────────────────────────
bookingAssignmentSchema.methods.isValid = function () {
  return (
    ["sent", "viewed"].includes(this.status) &&
    this.expiryTime > new Date() &&
    !this.respondedAt
  );
};

bookingAssignmentSchema.methods.canUserRespond = function () {
  return this.status === "countered" && this.expiryTime > new Date();
};

// Worker accepts at original price
bookingAssignmentSchema.methods.accept = async function () {
  if (!this.isValid()) {
    throw new Error("Assignment expired or already responded");
  }

  const Booking = mongoose.model("Booking");
  const Assignment = mongoose.model("BookingAssignment");

  // Reject all other pending assignments for same booking
  await Assignment.updateMany(
    {
      booking: this.booking,
      _id: { $ne: this._id },
      status: { $in: ["sent", "viewed"] },
    },
    {
      status: "rejected",
      respondedAt: new Date(),
      responseNote: "Another worker accepted this booking",
    },
  );

  this.finalPrice = this.originalPrice;
  this.status = "accepted";
  this.respondedAt = new Date();
  await this.save();
  await Booking.findByIdAndUpdate(this.booking, {
    worker: this.worker,
    status: "accepted",
    price: this.finalPrice,
  });

  return this;
};

// Worker rejects
bookingAssignmentSchema.methods.reject = async function (reason) {
  if (!["sent", "viewed"].includes(this.status)) {
    throw new Error("Cannot reject this assignment");
  }

  this.status = "rejected";
  this.respondedAt = new Date();
  if (reason) this.responseNote = reason;
  await this.save();

  return this;
};

// Worker proposes a counter price
bookingAssignmentSchema.methods.counter = async function (counterPrice, note) {
  if (!this.isValid()) {
    throw new Error("Assignment expired or already responded");
  }
  if (!counterPrice || counterPrice <= 0) {
    throw new Error("counterPrice must be a positive number");
  }
  this.status = "countered";
  this.counterPrice = counterPrice;
  this.counterNote = note || null;
  this.respondedAt = new Date();
  this.expiryTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  await this.save();

  return this;
};

// User accepts worker's counter price
bookingAssignmentSchema.methods.userAccept = async function () {
  if (!this.canUserRespond()) {
    throw new Error("Cannot respond to this offer");
  }

  const Booking = mongoose.model("Booking");
  const Assignment = mongoose.model("BookingAssignment");

  // Reject all other pending/countered assignments
  await Assignment.updateMany(
    {
      booking: this.booking,
      _id: { $ne: this._id },
      status: { $in: ["sent", "viewed", "countered"] },
    },
    {
      status: "user_rejected",
      userRespondedAt: new Date(),
    },
  );

  this.finalPrice = this.counterPrice;
  this.status = "user_accepted";
  this.userRespondedAt = new Date();
  await this.save();

  await Booking.findByIdAndUpdate(this.booking, {
    worker: this.worker,
    status: "accepted",
    totalAmount: this.finalPrice,
  });

  return this;
};

// User rejects worker's counter price
bookingAssignmentSchema.methods.userReject = async function () {
  if (!this.canUserRespond()) {
    throw new Error("Cannot respond to this offer");
  }

  this.status = "user_rejected";
  this.userRespondedAt = new Date();
  await this.save();

  return this;
};

// ── Statics ───────────────────────────────────────────────────────────────────
bookingAssignmentSchema.statics.sendToWorkers = async function (
  bookingId,
  workers,
  priority = 1,
) {
  const assignments = workers.map((w, index) => {
    const isObj = typeof w === "object" && w.workerId;
    return {
      booking: bookingId,
      worker: isObj ? w.workerId : w,
      originalPrice: isObj ? w.originalPrice : null,
      status: "sent",
      priority,
      assignmentOrder: index + 1,
      expiryTime: new Date(Date.now() + 30 * 60 * 1000),
    };
  });
  return await this.insertMany(assignments);
};

bookingAssignmentSchema.statics.expireOldAssignments = async function () {
  const result = await this.updateMany(
    {
      status: { $in: ["sent", "viewed", "countered"] },
      expiryTime: { $lt: new Date() },
    },
    { status: "expired" },
  );
  return result.modifiedCount;
};

// ── Indexes ───────────────────────────────────────────────────────────────────
bookingAssignmentSchema.index({ worker: 1, status: 1 });
bookingAssignmentSchema.index({ booking: 1, status: 1 });
bookingAssignmentSchema.index({ expiryTime: 1 });
bookingAssignmentSchema.index({ status: 1, assignedAt: -1 });
bookingAssignmentSchema.index({ booking: 1, worker: 1 }, { unique: true });

const BookingAssignment =
  mongoose.models.BookingAssignment ||
  mongoose.model("BookingAssignment", bookingAssignmentSchema);
export default BookingAssignment;
