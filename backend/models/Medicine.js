
const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    strength: {
      type: String,
      required: true,
    },
    dose: {
      type: String,
      required: true,
    },
    times: {
      type: [String],
      required: true,
      validate: {
        validator: (times) => times.length > 0,
        message: "At least one time is required",
      },
    },
    food: {
      type: String,
      enum: ["before", "after", "any"],
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockDays: {
      type: Number,
      default: 5,
      min: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
