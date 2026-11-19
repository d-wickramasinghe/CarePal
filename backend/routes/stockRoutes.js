
const express = require("express");
const mongoose = require("mongoose");

const Medicine = require("../models/Medicine");

const {
  calculateStockStatus,
} = require("../utils/stockUtils");

const router = express.Router();

// GET all medicine stock details
router.get("/", async (req, res) => {
  try {
    const medicines = await Medicine.find().lean();

    const stockDetails = medicines.map((medicine) => ({
      medicineId: medicine._id,
      name: medicine.name,
      strength: medicine.strength,
      dose: medicine.dose,
      times: medicine.times,
      lowStockDays: medicine.lowStockDays,
      ...calculateStockStatus(medicine),
    }));

    const lowStockCount = stockDetails.filter(
      (item) =>
        item.status === "low_stock" ||
        item.status === "out_of_stock"
    ).length;

    res.json({
      summary: {
        totalMedicines: stockDetails.length,
        lowStockCount,
      },
      medicines: stockDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// POST restock medicine
router.post("/:medicineId/restock", async (req, res) => {
  try {
    const { medicineId } = req.params;
    const quantity = Number(req.body.quantity);

    if (!mongoose.isValidObjectId(medicineId)) {
      return res.status(400).json({
        message: "Invalid medicine ID",
      });
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message: "Restock quantity must be greater than 0",
      });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      medicineId,
      {
        $inc: { stock: quantity },
      },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    res.json({
      message: "Medicine restocked successfully",
      medicineId: medicine._id,
      ...calculateStockStatus(medicine),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
