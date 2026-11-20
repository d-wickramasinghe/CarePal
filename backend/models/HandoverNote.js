const mongoose = require("mongoose");

const handoverNoteSchema = new mongoose.Schema(
  {
    shift: {
      type: String,
      enum: ["day-night", "night-day"],
      required: true,
    },
    category: {
      type: String,
      enum: ["medication", "patient-condition", "general-care"],
      required: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    caregiverName: {
      type: String,
      default: "Demo Caregiver",
      trim: true,
      maxlength: 100,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "HandoverNote",
  handoverNoteSchema
);
