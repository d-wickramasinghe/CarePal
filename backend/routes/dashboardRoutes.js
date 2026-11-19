
const express = require("express");
const Medicine = require("../models/Medicine");
const DoseLog = require("../models/DoseLog");

const router = express.Router();

// Check date format
function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

// Get last 7 calendar dates ending on selected date
function getWeekDates(endDate) {
  const dates = [];

  const end = new Date(`${endDate}T00:00:00Z`);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

// GET Family Dashboard
router.get("/weekly", async (req, res) => {
  try {
    const endDate = req.query.endDate;

    if (!isValidDate(endDate)) {
      return res.status(400).json({
        message: "Valid endDate is required (YYYY-MM-DD)",
      });
    }

    const dates = getWeekDates(endDate);
    const startDate = dates[0];

    const medicines = await Medicine.find({
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).lean();

    const logs = await DoseLog.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    const logMap = new Map();

    logs.forEach((log) => {
      const key = `${log.medicineId}-${log.date}-${log.time}`;
      logMap.set(key, log);
    });

    const dailyStats = [];
    const skippedDoses = [];

    let totalScheduled = 0;
    let totalGiven = 0;
    let totalSkipped = 0;
    let totalPending = 0;

    for (const date of dates) {
      let given = 0;
      let skipped = 0;
      let pending = 0;

      for (const medicine of medicines) {
        if (
          medicine.startDate > date ||
          medicine.endDate < date
        ) {
          continue;
        }

        for (const time of medicine.times) {
          const key = `${medicine._id}-${date}-${time}`;
          const log = logMap.get(key);

          if (!log) {
            pending++;
            continue;
          }

          if (log.status === "given") {
            given++;
          } else if (log.status === "skipped") {
            skipped++;

            skippedDoses.push({
              medicineId: medicine._id,
              name: medicine.name,
              strength: medicine.strength,
              dose: medicine.dose,
              date,
              time,
              reason: log.skipReason,
            });
          }
        }
      }

      const scheduled = given + skipped + pending;
      const recorded = given + skipped;

      const adherence =
        recorded > 0
          ? Math.round((given / recorded) * 100)
          : null;

      dailyStats.push({
        date,
        given,
        skipped,
        pending,
        scheduled,
        adherence,
      });

      totalGiven += given;
      totalSkipped += skipped;
      totalPending += pending;
      totalScheduled += scheduled;
    }

    const totalRecorded = totalGiven + totalSkipped;

    const adherencePercentage =
      totalRecorded > 0
        ? Math.round((totalGiven / totalRecorded) * 100)
        : null;

    skippedDoses.sort((a, b) => {
      return (
        `${b.date}T${b.time}`.localeCompare(
          `${a.date}T${a.time}`
        )
      );
    });

    res.json({
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalScheduled,
        totalRecorded,
        totalGiven,
        totalSkipped,
        totalPending,
        adherencePercentage,
      },
      dailyStats,
      skippedDoses,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
});

module.exports = router;
