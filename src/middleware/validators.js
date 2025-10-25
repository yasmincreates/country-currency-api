const { query, param } = require("express-validator");

/**
 * Validate query parameters for GET /countries
 */
const validateCountriesQuery = [
  query("region")
    .optional()
    .isString()
    .trim()
    .withMessage("Region must be a string"),

  query("currency")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency code must be 3 characters"),

  query("sort")
    .optional()
    .isIn([
      "gdp_desc",
      "gdp_asc",
      "population_desc",
      "population_asc",
      "name_asc",
      "name_desc",
    ])
    .withMessage("Invalid sort parameter"),
];

/**
 * Validate country name parameter
 */
const validateCountryName = [
  param("name")
    .notEmpty()
    .withMessage("Country name is required")
    .isString()
    .trim()
    .withMessage("Country name must be a string"),
];

module.exports = {
  validateCountriesQuery,
  validateCountryName,
};
