const { createCanvas } = require("canvas");
const fs = require("fs").promises;
const path = require("path");
const Country = require("../models/Country");

/**
 * Format large numbers with commas
 */
const formatNumber = (num) => {
  if (num === null || num === undefined) return "N/A";
  return new Intl.NumberFormat("en-GB").format(Math.round(num));
};

/**
 * Format GDP in billions
 */
const formatGdp = (gdp) => {
  if (!gdp) return "N/A";
  const billions = gdp / 1_000_000_000;
  return `$${billions.toFixed(2)}B`;
};

/**
 * Generate summary image with top 5 countries by GDP
 */
const generateSummaryImage = async (timestamp) => {
  try {
    // Get top 5 countries by estimated GDP
    const topCountries = await Country.findAll({
      where: {
        estimated_gdp: {
          [require("sequelize").Op.not]: null,
        },
      },
      order: [["estimated_gdp", "DESC"]],
      limit: 5,
      raw: true,
    });

    const totalCountries = await Country.count();

    // Create canvas
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Country Currency API Summary", width / 2, 60);

    // Subtitle with total countries
    ctx.font = "20px Arial";
    ctx.fillStyle = "#a0a0a0";
    ctx.fillText(`Total Countries: ${totalCountries}`, width / 2, 100);

    // Top 5 GDP section title
    ctx.fillStyle = "#4ecca3";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Top 5 Countries by Estimated GDP", 50, 160);

    // Draw top 5 countries
    let yPos = 210;
    topCountries.forEach((country, index) => {
      // Rank number
      ctx.fillStyle = "#4ecca3";
      ctx.font = "bold 28px Arial";
      ctx.fillText(`${index + 1}.`, 50, yPos);

      // Country name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.fillText(country.name, 90, yPos);

      // GDP value
      ctx.fillStyle = "#ffd700";
      ctx.font = "18px Arial";
      ctx.textAlign = "right";
      ctx.fillText(formatGdp(country.estimated_gdp), width - 50, yPos);

      // Currency and population info
      ctx.fillStyle = "#a0a0a0";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      const info = `${country.currency_code || "N/A"} | Pop: ${formatNumber(
        country.population
      )}`;
      ctx.fillText(info, 90, yPos + 22);

      yPos += 70;
    });

    // Timestamp at bottom
    ctx.fillStyle = "#666666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    const timeStr = new Date(timestamp).toISOString();
    ctx.fillText(`Last refreshed: ${timeStr}`, width / 2, height - 30);

    // Ensure cache directory exists
    const cacheDir = path.join(process.cwd(), "cache");
    try {
      await fs.access(cacheDir);
    } catch {
      await fs.mkdir(cacheDir, { recursive: true });
    }

    // Save image
    const buffer = canvas.toBuffer("image/png");
    const imagePath = path.join(cacheDir, "summary.png");
    await fs.writeFile(imagePath, buffer);

    console.log("✓ Summary image generated successfully");
    return imagePath;
  } catch (error) {
    console.error("✗ Failed to generate summary image:", error.message);
    throw error;
  }
};

module.exports = {
  generateSummaryImage,
};
