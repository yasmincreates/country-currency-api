const request = require("supertest");
const app = require("../src/app");
const { sequelize } = require("../src/config/database");
const Country = require("../src/models/Country");
const Metadata = require("../src/models/Metadata");

// Mock external API calls
jest.mock("../src/services/externalApi.service", () => ({
  fetchCountries: jest.fn().mockResolvedValue([
    {
      name: "Nigeria",
      capital: "Abuja",
      region: "Africa",
      population: 206139589,
      flag: "https://flagcdn.com/ng.svg",
      currencies: [{ code: "NGN", name: "Nigerian naira" }],
    },
    {
      name: "Ghana",
      capital: "Accra",
      region: "Africa",
      population: 31072940,
      flag: "https://flagcdn.com/gh.svg",
      currencies: [{ code: "GHS", name: "Ghanaian cedi" }],
    },
  ]),
  fetchExchangeRates: jest.fn().mockResolvedValue({
    NGN: 1600.23,
    GHS: 15.34,
    USD: 1.0,
  }),
}));

// Mock image generation
jest.mock("../src/utils/imageGenerator", () => ({
  generateSummaryImage: jest.fn().mockResolvedValue("/cache/summary.png"),
}));

describe("Country Currency API Tests", () => {
  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Clean up and close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Country.destroy({ where: {}, truncate: true });
    await Metadata.destroy({ where: {}, truncate: true });
  });

  describe("GET /", () => {
    it("should return API information", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("endpoints");
    });
  });

  describe("POST /countries/refresh", () => {
    it("should fetch and cache countries data successfully", async () => {
      const response = await request(app).post("/countries/refresh");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("total_countries");
      expect(response.body).toHaveProperty("last_refreshed_at");
      expect(response.body.total_countries).toBe(2);
    });

    it("should update existing countries on refresh", async () => {
      // First refresh
      await request(app).post("/countries/refresh");

      // Second refresh
      const response = await request(app).post("/countries/refresh");

      expect(response.status).toBe(200);
      expect(response.body.total_countries).toBe(2);

      // Verify only 2 countries in database (not 4)
      const count = await Country.count();
      expect(count).toBe(2);
    });
  });

  describe("GET /countries", () => {
    beforeEach(async () => {
      // Seed test data
      await Country.bulkCreate([
        {
          name: "Nigeria",
          capital: "Abuja",
          region: "Africa",
          population: 206139589,
          currency_code: "NGN",
          exchange_rate: 1600.23,
          estimated_gdp: 257674481.25,
          flag_url: "https://flagcdn.com/ng.svg",
          last_refreshed_at: new Date(),
        },
        {
          name: "Ghana",
          capital: "Accra",
          region: "Africa",
          population: 31072940,
          currency_code: "GHS",
          exchange_rate: 15.34,
          estimated_gdp: 3029834520.6,
          flag_url: "https://flagcdn.com/gh.svg",
          last_refreshed_at: new Date(),
        },
        {
          name: "United States",
          capital: "Washington, D.C.",
          region: "Americas",
          population: 331002651,
          currency_code: "USD",
          exchange_rate: 1.0,
          estimated_gdp: 496504976500.0,
          flag_url: "https://flagcdn.com/us.svg",
          last_refreshed_at: new Date(),
        },
      ]);
    });

    it("should return all countries", async () => {
      const response = await request(app).get("/countries");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it("should filter countries by region", async () => {
      const response = await request(app)
        .get("/countries")
        .query({ region: "Africa" });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0].region).toBe("Africa");
    });

    it("should filter countries by currency", async () => {
      const response = await request(app)
        .get("/countries")
        .query({ currency: "NGN" });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].currency_code).toBe("NGN");
    });

    it("should sort countries by GDP descending", async () => {
      const response = await request(app)
        .get("/countries")
        .query({ sort: "gdp_desc" });

      expect(response.status).toBe(200);
      expect(response.body[0].name).toBe("United States");
      // Convert to number since Sequelize returns DECIMAL as string
      expect(parseFloat(response.body[0].estimated_gdp)).toBeGreaterThan(
        parseFloat(response.body[1].estimated_gdp)
      );
    });

    it("should sort countries by population ascending", async () => {
      const response = await request(app)
        .get("/countries")
        .query({ sort: "population_asc" });

      expect(response.status).toBe(200);
      expect(response.body[0].population).toBeLessThan(
        response.body[1].population
      );
    });

    it("should return 400 for invalid sort parameter", async () => {
      const response = await request(app)
        .get("/countries")
        .query({ sort: "invalid_sort" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /countries/:name", () => {
    beforeEach(async () => {
      await Country.create({
        name: "Nigeria",
        capital: "Abuja",
        region: "Africa",
        population: 206139589,
        currency_code: "NGN",
        exchange_rate: 1600.23,
        estimated_gdp: 257674481.25,
        flag_url: "https://flagcdn.com/ng.svg",
        last_refreshed_at: new Date(),
      });
    });

    it("should return a country by name", async () => {
      const response = await request(app).get("/countries/Nigeria");

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Nigeria");
      expect(response.body).toHaveProperty("capital");
      expect(response.body).toHaveProperty("currency_code");
    });

    it("should be case-insensitive", async () => {
      const response = await request(app).get("/countries/nigeria");

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Nigeria");
    });

    it("should return 404 for non-existent country", async () => {
      const response = await request(app).get("/countries/Atlantis");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Country not found");
    });
  });

  describe("DELETE /countries/:name", () => {
    beforeEach(async () => {
      await Country.create({
        name: "Nigeria",
        capital: "Abuja",
        region: "Africa",
        population: 206139589,
        currency_code: "NGN",
        exchange_rate: 1600.23,
        estimated_gdp: 257674481.25,
        flag_url: "https://flagcdn.com/ng.svg",
        last_refreshed_at: new Date(),
      });
    });

    it("should delete a country successfully", async () => {
      const response = await request(app).delete("/countries/Nigeria");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Country deleted successfully");

      // Verify deletion
      const country = await Country.findOne({ where: { name: "Nigeria" } });
      expect(country).toBeNull();
    });

    it("should be case-insensitive", async () => {
      const response = await request(app).delete("/countries/nigeria");

      expect(response.status).toBe(200);
    });

    it("should return 404 when deleting non-existent country", async () => {
      const response = await request(app).delete("/countries/Atlantis");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Country not found");
    });
  });

  describe("GET /status", () => {
    it("should return status with zero countries initially", async () => {
      const response = await request(app).get("/status");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("total_countries");
      expect(response.body).toHaveProperty("last_refreshed_at");
      expect(response.body.total_countries).toBe(0);
      expect(response.body.last_refreshed_at).toBeNull();
    });

    it("should return correct count after adding countries", async () => {
      await Country.bulkCreate([
        {
          name: "Nigeria",
          capital: "Abuja",
          region: "Africa",
          population: 206139589,
          currency_code: "NGN",
          exchange_rate: 1600.23,
          estimated_gdp: 257674481.25,
          flag_url: "https://flagcdn.com/ng.svg",
          last_refreshed_at: new Date(),
        },
        {
          name: "Ghana",
          capital: "Accra",
          region: "Africa",
          population: 31072940,
          currency_code: "GHS",
          exchange_rate: 15.34,
          estimated_gdp: 3029834520.6,
          flag_url: "https://flagcdn.com/gh.svg",
          last_refreshed_at: new Date(),
        },
      ]);

      const response = await request(app).get("/status");

      expect(response.status).toBe(200);
      expect(response.body.total_countries).toBe(2);
    });

    it("should return last_refreshed_at after refresh", async () => {
      const timestamp = new Date().toISOString();
      await Metadata.create({
        key: "last_refreshed_at",
        value: timestamp,
      });

      const response = await request(app).get("/status");

      expect(response.status).toBe(200);
      expect(response.body.last_refreshed_at).toBe(timestamp);
    });
  });

  describe("GET /countries/image", () => {
    it("should return 404 when image does not exist", async () => {
      // Ensure cache directory is empty
      const fs = require("fs").promises;
      const path = require("path");
      const imagePath = path.join(process.cwd(), "cache", "summary.png");

      try {
        await fs.unlink(imagePath);
      } catch (error) {
        // File doesn't exist, which is what we want
      }

      const response = await request(app).get("/countries/image");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Summary image not found");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await request(app).get("/unknown-route");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Route not found");
    });
  });
});
