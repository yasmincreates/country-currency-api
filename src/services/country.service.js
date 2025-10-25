const { Op } = require("sequelize");
const Country = require("../models/Country");
const Metadata = require("../models/Metadata");
const { fetchCountries, fetchExchangeRates } = require("./externalApi.service");
const { generateSummaryImage } = require("../utils/imageGenerator");

/**
 * Generate a random multiplier between 1000 and 2000
 */
const generateRandomMultiplier = () => {
  return Math.random() * (2000 - 1000) + 1000;
};

/**
 * Calculate estimated GDP
 */
const calculateEstimatedGdp = (population, exchangeRate) => {
  if (!exchangeRate || exchangeRate === 0) {
    return null;
  }
  const multiplier = generateRandomMultiplier();
  return (population * multiplier) / exchangeRate;
};

/**
 * Refresh all countries data from external APIs
 */
const refreshCountriesData = async () => {
  try {
    // Fetch data from both external APIs
    const [countriesData, exchangeRates] = await Promise.all([
      fetchCountries(),
      fetchExchangeRates(),
    ]);

    const timestamp = new Date();
    const countriesToUpsert = [];

    // Process each country
    for (const countryData of countriesData) {
      const currencyCode =
        countryData.currencies && countryData.currencies.length > 0
          ? countryData.currencies[0].code
          : null;

      const exchangeRate =
        currencyCode && exchangeRates[currencyCode]
          ? exchangeRates[currencyCode]
          : null;

      const estimatedGdp =
        currencyCode && exchangeRate
          ? calculateEstimatedGdp(countryData.population, exchangeRate)
          : null;

      countriesToUpsert.push({
        name: countryData.name,
        capital: countryData.capital || null,
        region: countryData.region || null,
        population: countryData.population,
        currency_code: currencyCode,
        exchange_rate: exchangeRate,
        estimated_gdp: estimatedGdp,
        flag_url: countryData.flag || null,
        last_refreshed_at: timestamp,
      });
    }

    // Bulk upsert all countries
    await Country.bulkCreate(countriesToUpsert, {
      updateOnDuplicate: [
        "capital",
        "region",
        "population",
        "currency_code",
        "exchange_rate",
        "estimated_gdp",
        "flag_url",
        "last_refreshed_at",
        "updated_at",
      ],
    });

    // Update global refresh timestamp
    await Metadata.upsert({
      key: "last_refreshed_at",
      value: timestamp.toISOString(),
    });

    // Generate summary image
    await generateSummaryImage(timestamp);

    return {
      success: true,
      total: countriesToUpsert.length,
      timestamp,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all countries with optional filtering and sorting
 */
const getCountries = async (filters = {}) => {
  const whereClause = {};

  // Apply region filter
  if (filters.region) {
    whereClause.region = {
      [Op.like]: `%${filters.region}%`,
    };
  }

  // Apply currency filter
  if (filters.currency) {
    whereClause.currency_code = filters.currency.toUpperCase();
  }

  // Determine sorting
  let order = [["name", "ASC"]];
  if (filters.sort === "gdp_desc") {
    order = [["estimated_gdp", "DESC NULLS LAST"]];
  } else if (filters.sort === "gdp_asc") {
    order = [["estimated_gdp", "ASC NULLS LAST"]];
  } else if (filters.sort === "population_desc") {
    order = [["population", "DESC"]];
  } else if (filters.sort === "population_asc") {
    order = [["population", "ASC"]];
  }

  const countries = await Country.findAll({
    where: whereClause,
    order,
    raw: true,
  });

  return countries;
};

/**
 * Get a single country by name (case-insensitive)
 */
const getCountryByName = async (name) => {
  const country = await Country.findOne({
    where: {
      name: {
        [Op.like]: name,
      },
    },
    raw: true,
  });

  return country;
};

/**
 * Delete a country by name (case-insensitive)
 */
const deleteCountryByName = async (name) => {
  const deleted = await Country.destroy({
    where: {
      name: {
        [Op.like]: name,
      },
    },
  });

  return deleted > 0;
};

/**
 * Get system status
 */
const getStatus = async () => {
  const totalCountries = await Country.count();

  const metadata = await Metadata.findOne({
    where: { key: "last_refreshed_at" },
    raw: true,
  });

  return {
    total_countries: totalCountries,
    last_refreshed_at: metadata ? metadata.value : null,
  };
};

module.exports = {
  refreshCountriesData,
  getCountries,
  getCountryByName,
  deleteCountryByName,
  getStatus,
};
