const express = require("express");
const countryRoutes = require("./routes/country.routes");
const statusRoutes = require("./routes/status.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Country Currency API is running",
    version: "1.0.0",
    endpoints: {
      refresh: "POST /countries/refresh",
      countries: "GET /countries",
      country: "GET /countries/:name",
      delete: "DELETE /countries/:name",
      status: "GET /status",
      image: "GET /countries/image",
    },
  });
});

// API Routes
app.use("/countries", countryRoutes);
app.use("/status", statusRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
