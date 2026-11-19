
const express = require("express");
const Medicine = require("../models/Medicine");

const router = express.Router();

// Add a new medicine
router.post("/", async (req, res) => {
  try {
    const {
      name, strength, dose, times, food,
      startDate, endDate, stock, lowStockDays
    } = req.body;

    if (
      !name || !strength || !dose ||
      !Array.isArray(times) || times.length === 0 ||
      !["before", "after", "any"].includes(food) ||
      !startDate || !endDate
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
      startDate > endDate ||
      times.some((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))
    ) {
      return res.status(400).json({
        message: "Invalid dates or medicine times",
      });
    }

    const medicine = await Medicine.create({
      name, strength, dose, times, food,
      startDate, endDate, stock, lowStockDays
    });

    res.status(201).json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
