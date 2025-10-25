const express = require("express");
const router = express.Router();
const countryController = require("../controllers/country.controller");

// GET /status - Get system status
router.get("/", countryController.getStatus);

module.exports = router;
