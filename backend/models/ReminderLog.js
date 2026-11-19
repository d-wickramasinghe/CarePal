
const mongoose = require("mongoose");

const reminderLogSchema = new mongoose.Schema(
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
      enum: ["sending", "sent", "failed"],
      required: true,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    errorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

reminderLogSchema.index(
  { medicineId: 1, date: 1, time: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ReminderLog",
  reminderLogSchema
);
