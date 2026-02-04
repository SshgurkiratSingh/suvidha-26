const express = require("express");
const cors = require("cors");
const path = require("path");
const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/auth");
const citizenRoutes = require("./routes/citizen");
const billingRoutes = require("./routes/billing");
const applicationRoutes = require("./routes/applications");
const grievanceRoutes = require("./routes/grievances");
const specialRoutes = require("./routes/special");
const adminAuthRoutes = require("./routes/adminAuth");
const adminRoutes = require("./routes/admin");
const aiRoutes = require("./routes/ai");
const { prisma } = require("./prisma");

const app = express();

// Enable CORS with explicit configuration
app.use(
  cors({
    origin: "*", // Allow all origins (for development)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

// Serve uploaded documents statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "backend2",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api", billingRoutes);
app.use("/api", applicationRoutes);
app.use("/api", grievanceRoutes);
app.use("/api", specialRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", aiRoutes);

app.use(async (error, req, res, _next) => {
  console.error(error);
  try {
    if (prisma?.errorReport?.create) {
      await prisma.errorReport.create({
        data: {
          path: req.path,
          method: req.method,
          message: error.message || "Unknown error",
          stack: error.stack,
        },
      });
    }
  } catch (loggingError) {
    console.error("Failed to log error report", loggingError);
  }
  res.status(500).json({ message: "Internal server error" });
});

module.exports = { app };
