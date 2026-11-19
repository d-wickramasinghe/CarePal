
const express = require("express");
const Medicine = require("../models/Medicine");

const router = express.Router();
const mongoose = require("mongoose");
const DoseLog = require("../models/DoseLog");

function validateMedicine(body) {
  const {
    name, strength, dose, times, food,
    startDate, endDate, stock, lowStockDays
  } = body;

  if (
    !name || !strength || !dose ||
    !Array.isArray(times) || times.length === 0 ||
    !["before", "after", "any"].includes(food) ||
    !startDate || !endDate
  ) {
    return "Please provide all required fields";
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    startDate > endDate ||
    times.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
  ) {
    return "Invalid dates or medicine times";
  }

  if (
    !Number.isFinite(Number(stock)) ||
    Number(stock) < 0 ||
    !Number.isFinite(Number(lowStockDays)) ||
    Number(lowStockDays) < 1
  ) {
    return "Stock and low-stock days must be valid values";
  }

  return null;
}

// Add a new medicine
router.post("/", async (req, res) => {
  try {
    const validationError = validateMedicine(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const {
      name, strength, dose, times, food,
      startDate, endDate, stock, lowStockDays
    } = req.body;

    const medicine = await Medicine.create({
      name, strength, dose, times, food,
      startDate, endDate, stock, lowStockDays
    });

    res.status(201).json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an existing medicine
router.put("/:medicineId", async (req, res) => {
  try {
    const { medicineId } = req.params;

    if (!mongoose.isValidObjectId(medicineId)) {
      return res.status(400).json({ message: "Invalid medicine ID" });
    }

    const validationError = validateMedicine(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      medicineId,
      {
        $set: {
          name: req.body.name,
          strength: req.body.strength,
          dose: req.body.dose,
          times: req.body.times,
          food: req.body.food,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          stock: Number(req.body.stock),
          lowStockDays: Number(req.body.lowStockDays),
        },
      },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete the medicine while preserving historical dose records.
router.delete("/:medicineId", async (req, res) => {
  try {
    const { medicineId } = req.params;

    if (!mongoose.isValidObjectId(medicineId)) {
      return res.status(400).json({ message: "Invalid medicine ID" });
    }

    const medicine = await Medicine.findByIdAndDelete(medicineId);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({
      message: "Medicine deleted successfully",
      preservedDoseLogs: await DoseLog.countDocuments({ medicineId }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all medicines
router.get("/", async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
