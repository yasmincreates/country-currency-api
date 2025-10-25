const axios = require("axios");
require("dotenv").config();

const COUNTRIES_API =
  process.env.COUNTRIES_API_URL ||
  "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies";
const EXCHANGE_API =
  process.env.EXCHANGE_RATE_API_URL || "https://open.er-api.com/v6/latest/USD";
const TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;

/**
 * Fetch all countries from restcountries.com
 * @returns {Promise<Array>} Array of country objects
 */
const fetchCountries = async () => {
  try {
    const response = await axios.get(COUNTRIES_API, {
      timeout: TIMEOUT,
    });
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Countries API request timed out");
    }
    throw new Error(
      `Could not fetch data from Countries API: ${error.message}`
    );
  }
};

/**
 * Fetch exchange rates from open.er-api.com
 * @returns {Promise<Object>} Object with exchange rates
 */
const fetchExchangeRates = async () => {
  try {
    const response = await axios.get(EXCHANGE_API, {
      timeout: TIMEOUT,
    });

    if (response.data && response.data.rates) {
      return response.data.rates;
    }

    throw new Error("Invalid response format from Exchange Rate API");
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Exchange Rate API request timed out");
    }
    throw new Error(
      `Could not fetch data from Exchange Rate API: ${error.message}`
    );
  }
};

module.exports = {
  fetchCountries,
  fetchExchangeRates,
};
