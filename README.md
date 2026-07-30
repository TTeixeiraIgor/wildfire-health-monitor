# wildfire-health-monitor

A platform for tracking wildfire events, air pollution, and health conditions, providing real-time alerts and decision support for communities.

## Backend FIRMS Collector

This Node.js application collects wildfire data from the FIRMS source and focuses on Brazil.

### Installation

```bash
npm install
```

### Running locally

```bash
npm start
```

### Docker / PostgreSQL

```bash
docker compose up --build
```

The backend service will be available at `http://localhost:3000` and PostgreSQL at `localhost:5432`.

### Environment variables

- `PORT` - backend port (default `3000`)
- `DATABASE_URL` - PostgreSQL connection URL
- `FIRMS_MAP_KEY` - free MAP_KEY provided by NASA FIRMS to use the `/api/area/csv` endpoint
- `GOOGLE_GEOCODING_API_KEY` - Google Geocoding API key used to resolve city and state from coordinates

Use `.env.example` as a template for local configuration.

### Endpoints

- `GET /api/health` - checks whether the service is active.
- `GET /api/fires/brazil?source=modis` - returns FIRMS data filtered for Brazil using MODIS.
- `GET /api/fires/brazil?source=viirs` - returns FIRMS data filtered for Brazil using VIIRS.

### Notes

- Data is retrieved directly from public FIRMS CSV sources.
- In-memory caching is applied for 15 minutes to reduce the number of downloads.
