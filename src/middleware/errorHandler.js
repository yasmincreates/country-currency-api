const { validationResult } = require("express-validator");

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = {};
    errors.array().forEach((error) => {
      details[error.path] = error.msg;
    });

    return res.status(400).json({
      error: "Validation failed",
      details,
    });
  }

  next();
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // External API errors (503)
  if (err.message && err.message.includes("Could not fetch data from")) {
    return res.status(503).json({
      error: "External data source unavailable",
      details: err.message,
    });
  }

  // Validation errors (400)
  if (err.name === "SequelizeValidationError") {
    const details = {};
    err.errors.forEach((error) => {
      details[error.path] = error.message;
    });

    return res.status(400).json({
      error: "Validation failed",
      details,
    });
  }

  // Unique constraint errors (400)
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      error: "Validation failed",
      details: {
        name: "Country name already exists",
      },
    });
  }

  // Database connection errors (500)
  if (err.name === "SequelizeConnectionError") {
    return res.status(500).json({
      error: "Internal server error",
      details: "Database connection failed",
    });
  }

  // Default server error (500)
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};

module.exports = {
  handleValidationErrors,
  errorHandler,
};
