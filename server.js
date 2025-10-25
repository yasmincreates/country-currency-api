require("dotenv").config();
const app = require("./src/app");
const { sequelize, testConnection } = require("./src/config/database");
const Country = require("./src/models/Country");
const Metadata = require("./src/models/Metadata");

const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("✓ Database models synchronized");

    // Start listening
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  await sequelize.close();
  process.exit(0);
});

startServer();
