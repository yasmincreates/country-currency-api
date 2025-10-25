const countryService = require("../services/country.service");
const path = require("path");
const fs = require("fs").promises;

/**
 * POST /countries/refresh
 * Fetch and cache all countries data from external APIs
 */
const refreshCountries = async (req, res, next) => {
  try {
    const result = await countryService.refreshCountriesData();

    res.status(200).json({
      message: "Countries data refreshed successfully",
      total_countries: result.total,
      last_refreshed_at: result.timestamp.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /countries
 * Get all countries with optional filtering and sorting
 */
const getAllCountries = async (req, res, next) => {
  try {
    const filters = {
      region: req.query.region,
      currency: req.query.currency,
      sort: req.query.sort,
    };

    const countries = await countryService.getCountries(filters);
    res.status(200).json(countries);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /countries/:name
 * Get a single country by name
 */
const getCountryByName = async (req, res, next) => {
  try {
    const country = await countryService.getCountryByName(req.params.name);

    if (!country) {
      return res.status(404).json({
        error: "Country not found",
      });
    }

    res.status(200).json(country);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /countries/:name
 * Delete a country by name
 */
const deleteCountry = async (req, res, next) => {
  try {
    const deleted = await countryService.deleteCountryByName(req.params.name);

    if (!deleted) {
      return res.status(404).json({
        error: "Country not found",
      });
    }

    res.status(200).json({
      message: "Country deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /status
 * Get system status
 */
const getStatus = async (req, res, next) => {
  try {
    const status = await countryService.getStatus();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /countries/image
 * Serve the generated summary image
 */
const getSummaryImage = async (req, res, next) => {
  try {
    const imagePath = path.join(process.cwd(), "cache", "summary.png");

    // Check if image exists
    try {
      await fs.access(imagePath);
      res.sendFile(imagePath);
    } catch {
      res.status(404).json({
        error: "Summary image not found",
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  refreshCountries,
  getAllCountries,
  getCountryByName,
  deleteCountry,
  getStatus,
  getSummaryImage,
};
