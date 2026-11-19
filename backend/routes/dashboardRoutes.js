
const express = require("express");
const Medicine = require("../models/Medicine");
const DoseLog = require("../models/DoseLog");
const { calculateStockStatus } = require("../utils/stockUtils");

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
    const doseDetails = [];

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
            doseDetails.push({
              date,
              medicineName: medicine.name,
              strength: medicine.strength,
              time,
              status: "pending",
              skipReason: "",
            });
            continue;
          }

          if (log.status === "given") {
            given++;
            doseDetails.push({
              date,
              medicineName: medicine.name,
              strength: medicine.strength,
              time,
              status: "given",
              skipReason: "",
            });
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
            doseDetails.push({
              date,
              medicineName: medicine.name,
              strength: medicine.strength,
              time,
              status: "skipped",
              skipReason: log.skipReason || "",
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
      doseDetails,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
});

// Generate caregiver notifications from live medicine and dose data.
router.get("/notifications", async (req, res) => {
  try {
    const today = req.query.date;

    if (!isValidDate(today)) {
      return res.status(400).json({
        message: "Valid date is required (YYYY-MM-DD)",
      });
    }

    const medicines = await Medicine.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).lean();

    const logs = await DoseLog.find({ date: today }).lean();
    const logMap = new Map(
      logs.map((log) => [
        `${log.medicineId}-${log.time}`,
        log,
      ])
    );

    const notifications = [];
    let sequence = 0;
    const now = new Date();
    const sriLankaTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    for (const medicine of medicines) {
      for (const time of medicine.times) {
        const log = logMap.get(`${medicine._id}-${time}`);
        const status = log ? log.status : "pending";

        if (!log && time > sriLankaTime) {
          notifications.push({
            id: `upcoming-${medicine._id}-${time}`,
            category: "upcoming",
            title: "Upcoming Dose",
            medicineName: medicine.name,
            message: `${medicine.name} is scheduled at ${time}.`,
            time,
            read: false,
            sortOrder: ++sequence,
          });
        } else if (!log && time <= sriLankaTime) {
          notifications.push({
            id: `missed-${medicine._id}-${today}-${time}`,
            category: "missed",
            title: "Missed Dose",
            medicineName: medicine.name,
            message: `${medicine.name} at ${time} is still pending.`,
            time,
            read: false,
            sortOrder: ++sequence,
          });
        }
      }

      const stock = calculateStockStatus(medicine);

      if (
        stock.status === "low_stock" ||
        stock.status === "out_of_stock"
      ) {
        notifications.push({
          id: `stock-${medicine._id}`,
          category: "stock",
          title: "Low Stock Alert",
          medicineName: medicine.name,
          message:
            stock.status === "out_of_stock"
              ? `${medicine.name} is out of stock.`
              : `${medicine.name} has approximately ${stock.daysRemaining} days of stock remaining.`,
          time: "",
          read: false,
          sortOrder: ++sequence,
        });
      }
    }

    res.json({
      date: today,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate notifications",
    });
  }
});

module.exports = router;
