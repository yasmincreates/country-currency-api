const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "railway",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connection established successfully.");
  } catch (error) {
    console.error("✗ Unable to connect to the database:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
