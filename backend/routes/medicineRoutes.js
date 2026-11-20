
const express = require("express");
const Medicine = require("../models/Medicine");

const router = express.Router();
const mongoose = require("mongoose");
const DoseLog = require("../models/DoseLog");
const multer = require("multer");

const MAX_PRESCRIPTION_SIZE = 5 * 1024 * 1024;
const prescriptionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRESCRIPTION_SIZE },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error("Prescription must be JPG, PNG, or WEBP"));
      return;
    }

    callback(null, true);
  },
});

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

function normalizeMultipartMedicine(body) {
  const normalized = { ...body };

  if (typeof normalized.times === "string") {
    try {
      normalized.times = JSON.parse(normalized.times);
    } catch {
      normalized.times = normalized.times
        .split(",")
        .map((time) => time.trim())
        .filter(Boolean);
    }
  }

  normalized.stock = normalized.stock === undefined
    ? 0
    : Number(normalized.stock);
  normalized.lowStockDays = normalized.lowStockDays === undefined
    ? 5
    : Number(normalized.lowStockDays);

  return normalized;
}

// Add a new medicine
router.post("/", prescriptionUpload.single("prescription"), async (req, res) => {
  try {
    req.body = normalizeMultipartMedicine(req.body);
    const validationError = validateMedicine(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const {
      name, strength, dose, times, food,
      startDate, endDate, stock, lowStockDays
    } = req.body;

    const prescription = req.file ? {
      data: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    } : undefined;

    const medicine = await Medicine.create({
      name, strength, dose, times, food,
      startDate, endDate, stock, lowStockDays,
      ...(prescription ? { prescription } : {}),
    });

    res.status(201).json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an existing medicine
router.put("/:medicineId", prescriptionUpload.single("prescription"), async (req, res) => {
  try {
    const { medicineId } = req.params;
    req.body = normalizeMultipartMedicine(req.body);

    if (!mongoose.isValidObjectId(medicineId)) {
      return res.status(400).json({ message: "Invalid medicine ID" });
    }

    const validationError = validateMedicine(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const update = {
          name: req.body.name,
          strength: req.body.strength,
          dose: req.body.dose,
          times: req.body.times,
          food: req.body.food,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          stock: Number(req.body.stock),
          lowStockDays: Number(req.body.lowStockDays),
    };

    if (req.file) {
      update.prescription = {
        data: req.file.buffer,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
      };
    } else if (req.body.removePrescription === "true") {
      update.prescription = {
        data: undefined,
        filename: "",
        contentType: "",
        size: 0,
        uploadedAt: null,
      };
    }

    const medicine = await Medicine.findByIdAndUpdate(
      medicineId,
      { $set: update },
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

// Serve prescription data only through an authenticated-application route.
// This demo has no auth; restrict exposure to the Caregiver and Family UI.
router.get("/:medicineId/prescription", async (req, res) => {
  try {
    const { medicineId } = req.params;

    if (!mongoose.isValidObjectId(medicineId)) {
      return res.status(400).json({ message: "Invalid medicine ID" });
    }

    const medicine = await Medicine.findById(medicineId)
      .select("+prescription.data");

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    if (!medicine.prescription?.data) {
      return res.status(404).json({
        message: "Prescription attachment not found",
      });
    }

    res.set({
      "Content-Type": medicine.prescription.contentType,
      "Content-Length": medicine.prescription.data.length,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });

    res.send(medicine.prescription.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
