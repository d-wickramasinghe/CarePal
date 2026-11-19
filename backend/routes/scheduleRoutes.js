
const express = require("express");
const mongoose = require("mongoose");
const Medicine = require("../models/Medicine");
const DoseLog = require("../models/DoseLog");
const { getDoseQuantity } = require("../utils/stockUtils");

const router = express.Router();

// GET medication schedule for a full month
router.get("/month/:month", async (req, res) => {
  try {
    const { month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: "Invalid month. Use YYYY-MM",
      });
    }

    const monthStart = new Date(`${month}-01T00:00:00Z`);
    if (
      Number.isNaN(monthStart.getTime()) ||
      monthStart.toISOString().slice(0, 7) !== month
    ) {
      return res.status(400).json({
        message: "Invalid month",
      });
    }

    const nextMonth = new Date(monthStart);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

    const medicines = await Medicine.find({
      startDate: { $lte: nextMonth.toISOString().slice(0, 10) },
      endDate: { $gte: monthStart.toISOString().slice(0, 10) },
    }).lean();

    const startDate = monthStart.toISOString().slice(0, 10);
    const endDate = new Date(nextMonth.getTime() - 86400000)
      .toISOString()
      .slice(0, 10);

    const logs = await DoseLog.find({
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    const logMap = new Map(
      logs.map((log) => [
        `${log.medicineId}-${log.date}-${log.time}`,
        log,
      ])
    );

    const dates = [];

    for (
      let date = new Date(monthStart);
      date < nextMonth;
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      const dateString = date.toISOString().slice(0, 10);
      const doses = [];

      for (const medicine of medicines) {
        if (
          medicine.startDate <= dateString &&
          medicine.endDate >= dateString
        ) {
          for (const time of medicine.times) {
            const log = logMap.get(
              `${medicine._id}-${dateString}-${time}`
            );

            doses.push({
              medicineId: medicine._id,
              medicineName: medicine.name,
              name: medicine.name,
              strength: medicine.strength,
              dose: medicine.dose,
              time,
              date: dateString,
              status: log ? log.status : "pending",
              skipReason: log ? log.skipReason : "",
            });
          }
        }
      }

      doses.sort((a, b) => a.time.localeCompare(b.time));
      dates.push({ date: dateString, doses });
    }

    res.json({
      month,
      days: dates,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load monthly schedule",
    });
  }
});

// GET daily medicine schedule
router.get("/:date", async (req, res) => {
  try {
    const { date } = req.params;

    if (!isValidDate(date)) {
      return res.status(400).json({
        message: "Invalid date. Use YYYY-MM-DD",
      });
    }

    const medicines = await Medicine.find({
      startDate: { $lte: date },
      endDate: { $gte: date },
    });

    const logs = await DoseLog.find({ date });

    const schedule = medicines.flatMap((medicine) =>
      medicine.times.map((time) => {
        const log = logs.find(
          (item) =>
            item.medicineId.toString() === medicine._id.toString() &&
            item.time === time
        );

        return {
          medicineId: medicine._id,
          name: medicine.name,
          strength: medicine.strength,
          dose: medicine.dose,
          food: medicine.food,
          time,
          date,
          status: log ? log.status : "pending",
          skipReason: log ? log.skipReason : "",
        };
      })
    );

    schedule.sort((a, b) => a.time.localeCompare(b.time));

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST update dose status

router.post("/status/update", async (req, res) => {
  try {
    const { medicineId, date, time, status, skipReason } =
      req.body;

    if (
      !mongoose.isValidObjectId(medicineId) ||
      !isValidDate(date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || "") ||
      !["given", "skipped"].includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid dose information",
      });
    }

    if (
      status === "skipped" &&
      (!skipReason || !skipReason.trim())
    ) {
      return res.status(400).json({
        message: "Skip reason is required",
      });
    }

    const medicine = await Medicine.findById(medicineId);

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    if (
      date < medicine.startDate ||
      date > medicine.endDate ||
      !medicine.times.includes(time)
    ) {
      return res.status(400).json({
        message: "Dose is not in the medicine schedule",
      });
    }

    const quantity = getDoseQuantity(medicine.dose);

    if (!quantity) {
      return res.status(400).json({
        message: "Dose quantity must begin with a number",
      });
    }

    const existingLog = await DoseLog.findOne({
      medicineId,
      date,
      time,
    });

    const previousStatus = existingLog?.status || "pending";

    if (previousStatus !== "given" && status === "given") {
      if (medicine.stock < quantity) {
        return res.status(400).json({
          message: "Not enough medicine stock",
        });
      }

      medicine.stock -= quantity;
      await medicine.save();
    } else if (
      previousStatus === "given" &&
      status === "skipped"
    ) {
      medicine.stock += quantity;
      await medicine.save();
    }

    const log = await DoseLog.findOneAndUpdate(
      { medicineId, date, time },
      {
        $set: {
          status,
          skipReason:
            status === "skipped" ? skipReason.trim() : "",
          recordedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      message: "Dose status updated successfully",
      log,
      remainingStock: medicine.stock,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

module.exports = router;
