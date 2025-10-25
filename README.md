# 🌍 Country-Currency API

The Country Currency API provides real-time access to country and currency data.  
It allows developers to retrieve country details, currency information, and flag images efficiently.

🧠 Built with Node.js, Express, MySQL and Sequelize

![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![Express](https://img.shields.io/badge/express-4.18.2-blue)
![MySQL](https://img.shields.io/badge/mysql-8.0-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 💡 What This Does

The API fetches country data from **REST Countries**, matches each currency with live exchange rates from **Open Exchange Rates**, and calculates estimated GDP based on population and exchange rate.

You can:

- Filter by region or currency
- Sort by GDP
- Get any country’s details
- Generate a summary image of the top 5 richest countries

## Quick Start 🚀

```bash
# Clone the repo
git clone https://github.com/yasmincreates/country-currency-api.git
cd country-currency-api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Create database
mysql -u root -p
CREATE DATABASE country_currency_db;

# Start the server
npm run dev

# Load initial data
curl -X POST http://localhost:3000/countries/refresh
```

Server runs on `http://localhost:3000`

## What It Computes

For each country, the API stores:

- **Name** - Country name
- **Capital** - Capital city
- **Region** - Geographic region
- **Population** - Total population
- **Currency Code** - Primary currency (e.g., NGN, USD)
- **Exchange Rate** - Current rate against USD
- **Estimated GDP** - Calculated as `population × random(1000-2000) ÷ exchange_rate`
- **Flag URL** - Country flag image
- **Last Refreshed** - Timestamp of last data update

Example:

```json
{
  "id": 1,
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139589,
  "currency_code": "NGN",
  "exchange_rate": 1600.23,
  "estimated_gdp": 257674481.25,
  "flag_url": "https://flagcdn.com/ng.svg",
  "last_refreshed_at": "2025-10-22T18:00:00.000Z"
}
```

## API Endpoints

### 1. Refresh Country Data

Fetches all countries and exchange rates, then caches in database.

```
POST /countries/refresh
```

**Response (200):**

```json
{
  "message": "Countries data refreshed successfully",
  "total_countries": 250,
  "last_refreshed_at": "2025-10-22T18:00:00.000Z"
}
```

**Errors:**

- `503` - External API unavailable

---

### 2. Get All Countries (with Filters)

```
GET /countries?region=Africa&sort=gdp_desc
```

**Available Filters:**

- `region` - Filter by geographic region (Africa, Europe, Asia, Americas, Oceania)
- `currency` - Filter by currency code (NGN, USD, EUR, GBP, etc.)
- `sort` - Sort results:
  - `gdp_desc` - Highest GDP first
  - `gdp_asc` - Lowest GDP first
  - `population_desc` - Most populous first
  - `population_asc` - Least populous first

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    ...
  }
]
```

**Errors:**

- `400` - Invalid filter parameters

---

### 3. Get a Specific Country

```
GET /countries/Nigeria
```

Case-insensitive. Works with `Nigeria`, `nigeria`, or `NIGERIA`.

**Response (200):** Returns country object

**Errors:**

- `404` - Country not found

---

### 4. Delete a Country

```
DELETE /countries/Nigeria
```

**Response (200):**

```json
{
  "message": "Country deleted successfully"
}
```

**Errors:**

- `404` - Country not found

---

### 5. Get System Status

```
GET /status
```

**Response (200):**

```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-22T18:00:00.000Z"
}
```

---

### 6. Get Summary Image 📊

Returns a PNG image showing top 5 countries by GDP.

```
GET /countries/image
```

**Response (200):** PNG image file

**Errors:**

- `404` - Image not found (run refresh first)

---

## Tech Stack

| What              | Why                                               |
| ----------------- | ------------------------------------------------- |
| Node.js + Express | Fast, simple, everyone uses it                    |
| MySQL + Sequelize | Need persistent storage, ORM makes queries easier |
| Axios             | Clean HTTP client for external APIs               |
| Canvas            | Generates summary images programmatically         |
| express-validator | Request validation made simple                    |

## Project Structure

```
country-currency-api/
├── src/
│   ├── config/          # Database connection setup
│   ├── controllers/     # Request handlers
│   ├── models/          # Sequelize models (Country, Metadata)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (external APIs, data processing)
│   ├── utils/           # Helper functions (image generation)
│   ├── middleware/      # Error handling, validation
│   └── app.js           # Express app configuration
├── cache/               # Generated summary images
├── tests/               # Jest test suite
├── .env.example         # Environment template
├── server.js            # Application entry point
└── package.json
```

Clean separation of concerns. Controllers handle requests, services contain business logic, models define data structure.

## Running Locally

**Prerequisites:**

- Node.js v16 or higher
- MySQL v8.0 or higher
- npm

**Setup:**

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=country_currency_db
DB_USER=root
DB_PASSWORD=your_password

COUNTRIES_API_URL=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD
API_TIMEOUT=10000
```

**Create database:**

```sql
DB_NAME=country_currency
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Start server:**

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

## Testing

Use curl, Postman, or your favourite HTTP client:

```bash
# Refresh data
curl -X POST http://localhost:3000/countries/refresh

# Get all countries
curl http://localhost:3000/countries

# Filter by region
curl "http://localhost:3000/countries?region=Africa"

# Sort by GDP
curl "http://localhost:3000/countries?sort=gdp_desc"

# Get single country
curl http://localhost:3000/countries/Nigeria

# Download image
curl http://localhost:3000/countries/image --output summary.png
```

Run test suite:

```bash
npm test
```

## Deployment

Live API: https://country-currency-api-production-22c6.up.railway.app/

Deployed on Railway.

**Steps:**

1. Push code to GitHub
2. Create new project on Railway
3. Add MySQL database service
4. Configure environment variables:

```env
NODE_ENV=production
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_TCP_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
```

5. Deploy from GitHub
6. Generate public domain
7. Trigger initial refresh: `curl -X POST https://your-app.railway.app/countries/refresh`

Done.

## What I Learned

This was Stage 2 of HNG Internship. Much more complex than Stage 1.

**Technical:**

- Working with external APIs and handling timeouts
- Database design with Sequelize ORM
- Bulk upsert operations (updating existing records vs inserting new ones)
- Image generation with Canvas (trickier than expected)
- Proper error handling (400, 404, 500, 503 status codes)
- Environment-based configuration

**The hard parts:**

- Getting Canvas to work across different platforms (needs system dependencies)
- Matching currency codes from countries API with exchange rates API
- Handling countries with multiple currencies or no currency
- Route ordering (/:name routes must come after specific routes like /image)
- Testing all filter combinations
- Making sure the random GDP multiplier regenerates on each refresh

**The biggest lesson:** External APIs fail. Timeout handling and graceful degradation aren't optional, they're essential.

## Known Limitations

- **GDP estimation is not real** - It's just `population × random(1000-2000) ÷ exchange_rate`. For learning purposes only.
- **No authentication** - Anyone can refresh, delete, or query data
- **Image generation requires system libraries** - Canvas needs Cairo, Pango, etc. installed
- **Rate limiting not implemented** - Could be abused in production
- **No caching layer** - Every request hits the database

For a learning project, these are acceptable trade-offs. A production system would need Redis for caching, proper auth, and rate limiting.

## Error Handling

The API returns consistent JSON error responses:

**400 Bad Request:**

```json
{
  "error": "Validation failed",
  "details": {
    "currency_code": "Currency code must be 3 characters"
  }
}
```

**404 Not Found:**

```json
{
  "error": "Country not found"
}
```

**503 Service Unavailable:**

```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from Countries API"
}
```

## Contributing

This is a learning project for HNG Internship, but if you spot issues or want to suggest improvements, feel free to open an issue.

## Author

Yasmin Abdulrahman

Building backend systems. Learning through HNG Internship.

- GitHub: [@yasmincreates](https://github.com/yasmincreates)
- Linkedin: - [LinkedIn](https://www.linkedin.com/in/yasminabdulrahman/)

## License

MIT

## Acknowledgements

- [REST Countries API](https://restcountries.com)
- [Open Exchange Rates API](https://open.er-api.com)
- HNG Internship Cohort 13

---

Stage 1 taught me REST APIs and filtering. Stage 2 taught me external integrations, database persistence, and that timeouts are your friend.
