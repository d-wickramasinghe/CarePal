
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendReminderEmail(medicine, time, date) {
  const recipient = process.env.REMINDER_EMAIL;

  if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_APP_PASSWORD ||
    !recipient
  ) {
    throw new Error("Email configuration is missing");
  }

  const message = [
    "Hello Caregiver,",
    "",
    "This is your scheduled medication reminder.",
    "",
    `Medicine: ${medicine.name}`,
    `Strength: ${medicine.strength}`,
    `Dose: ${medicine.dose}`,
    `Time: ${time}`,
    `Date: ${date}`,
    `Food: ${medicine.food}`,
    "",
    "Please check the CarePal application and record",
    "whether the dose was given or skipped.",
    "",
    "CarePal Medication Management System",
  ].join("\n");

  const info = await transporter.sendMail({
    from: {
      name: "CarePal Reminders",
      address: process.env.EMAIL_USER,
    },
    to: recipient,
    subject: `Medication Reminder: ${medicine.name}`,
    text: message,
  });

  return info;
}

module.exports = { sendReminderEmail };
