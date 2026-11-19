
const cron = require("node-cron");

const Medicine = require("../models/Medicine");
const DoseLog = require("../models/DoseLog");
const ReminderLog = require("../models/ReminderLog");

const { sendReminderEmail } = require("./emailService");

const TIMEZONE =
  process.env.REMINDER_TIMEZONE || "Asia/Colombo";

// Get current date and time in selected timezone
function getLocalDateTime() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

// Send reminders for doses due at the current minute
async function checkMedicationReminders() {
  const { date, time } = getLocalDateTime();

  console.log(`Checking reminders: ${date} ${time}`);

  try {
    const medicines = await Medicine.find({
      startDate: { $lte: date },
      endDate: { $gte: date },
      times: time,
    });

    for (const medicine of medicines) {
      try {
        // Do not remind for doses already recorded
        const doseLog = await DoseLog.findOne({
          medicineId: medicine._id,
          date,
          time,
        });

        if (doseLog) {
          continue;
        }

        // Claim this dose before sending
        // Unique index prevents duplicate claims
        try {
          await ReminderLog.create({
            medicineId: medicine._id,
            date,
            time,
            status: "sending",
          });
        } catch (error) {
          if (error.code === 11000) {
            continue;
          }

          throw error;
        }

        try {
          await sendReminderEmail(medicine, time, date);

          await ReminderLog.updateOne(
            {
              medicineId: medicine._id,
              date,
              time,
            },
            {
              $set: {
                status: "sent",
                sentAt: new Date(),
                errorMessage: "",
              },
            }
          );

          console.log(
            `Reminder sent: ${medicine.name} at ${time}`
          );
        } catch (error) {
          await ReminderLog.updateOne(
            {
              medicineId: medicine._id,
              date,
              time,
            },
            {
              $set: {
                status: "failed",
                errorMessage: error.message,
              },
            }
          );

          console.error(
            `Reminder failed for ${medicine.name}:`,
            error.message
          );
        }
      } catch (error) {
        console.error(
          `Reminder processing error:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error(
      "Reminder scheduler error:",
      error.message
    );
  }
}

// Run every minute
function startReminderScheduler() {
  cron.schedule(
    "* * * * *",
    checkMedicationReminders,
    {
      timezone: TIMEZONE,
      noOverlap: true,
    }
  );

  console.log(
    `Medication reminder scheduler started (${TIMEZONE})`
  );
}

module.exports = {
  startReminderScheduler,
  checkMedicationReminders,
};
