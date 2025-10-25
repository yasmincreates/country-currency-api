const express = require("express");
const router = express.Router();
const countryController = require("../controllers/country.controller");
const {
  validateCountriesQuery,
  validateCountryName,
} = require("../middleware/validators");
const { handleValidationErrors } = require("../middleware/errorHandler");

// POST /countries/refresh - Refresh countries data
router.post("/refresh", countryController.refreshCountries);

// GET /countries/image - Get summary image (must be before /:name to avoid conflicts)
router.get("/image", countryController.getSummaryImage);

// GET /countries - Get all countries with optional filters
router.get(
  "/",
  validateCountriesQuery,
  handleValidationErrors,
  countryController.getAllCountries
);

// GET /countries/:name - Get single country
router.get(
  "/:name",
  validateCountryName,
  handleValidationErrors,
  countryController.getCountryByName
);

// DELETE /countries/:name - Delete country
router.delete(
  "/:name",
  validateCountryName,
  handleValidationErrors,
  countryController.deleteCountry
);

module.exports = router;
