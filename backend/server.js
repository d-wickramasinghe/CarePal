
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const medicineRoutes = require("./routes/medicineRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const stockRoutes = require("./routes/stockRoutes");

const {
  startReminderScheduler,
} = require("./services/reminderScheduler");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.get("/", (req, res) => {
  res.json({
    message: "CarePal API is running",
  });
});

app.use("/api/medicines", medicineRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/stock", stockRoutes);

const PORT = process.env.PORT || 5000;

// Connect MongoDB before starting scheduler
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startReminderScheduler();
    });
  } catch (error) {
    console.error(
      "MongoDB Connection Error:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
