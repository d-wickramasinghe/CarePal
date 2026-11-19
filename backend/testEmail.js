
require("dotenv").config();

const { sendReminderEmail } = require("./services/emailService");

async function testEmail() {
  try {
    const medicine = {
      name: "Demo Medicine A",
      strength: "500mg",
      dose: "1 tablet",
      food: "after",
    };

    await sendReminderEmail(
      medicine,
      "08:00",
      "2026-11-18"
    );

    console.log("Test email sent successfully!");
  } catch (error) {
    console.error(
      "Email test failed:",
      error.message
    );
  }
}

testEmail();
