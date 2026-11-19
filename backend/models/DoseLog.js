
const mongoose = require("mongoose");

const doseLogSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["given", "skipped"],
      required: true,
    },

    skipReason: {
      type: String,
      default: "",
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate logs for the same scheduled dose
doseLogSchema.index(
  { medicineId: 1, date: 1, time: 1 },
  { unique: true }
);

module.exports = mongoose.model("DoseLog", doseLogSchema);
