const express = require("express");
const mongoose = require("mongoose");
const HandoverNote = require("../models/HandoverNote");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { shift, category, note } = req.body;

    if (
      !["day-night", "night-day"].includes(shift) ||
      !["medication", "patient-condition", "general-care"].includes(category) ||
      typeof note !== "string" ||
      !note.trim()
    ) {
      return res.status(400).json({
        message: "Shift, category, and note are required",
      });
    }

    const handoverNote = await HandoverNote.create({
      shift,
      category,
      note: note.trim(),
      caregiverName: "Demo Caregiver",
      acknowledged: false,
    });

    res.status(201).json(handoverNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const notes = await HandoverNote.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/acknowledge", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid handover note ID",
      });
    }

    const note = await HandoverNote.findByIdAndUpdate(
      id,
      {
        $set: {
          acknowledged: true,
          acknowledgedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({
        message: "Handover note not found",
      });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
