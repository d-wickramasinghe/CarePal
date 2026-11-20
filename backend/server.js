
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const medicineRoutes = require("./routes/medicineRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const stockRoutes = require("./routes/stockRoutes");
const handoverRoutes = require("./routes/handoverRoutes");

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
app.use("/api/handover-notes", handoverRoutes);

app.use((error, req, res, next) => {
  if (error?.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Prescription image must be 5MB or smaller",
      });
    }

    return res.status(400).json({
      message: "Invalid prescription upload",
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message || "Request failed",
    });
  }

  next();
});

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
