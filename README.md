# wildfire-health-monitor

A fullstack platform for tracking wildfire events, air pollution, and health conditions, now with authenticated access control built in Next.js.

## Stack

- `Next.js` with App Router for frontend and backend route handlers
- `React` for the authenticated UI
- `HeroUI` for the component system
- `PostgreSQL` for wildfire and authentication data
- `pg` for database access
- `bcryptjs` + signed HTTP-only cookies for authentication

### Installation

```bash
npm install
```

### Running locally

```bash
npm run dev
```

### Docker / PostgreSQL

```bash
docker compose up --build
```

The full application will be available at `http://localhost:3000` and PostgreSQL at `localhost:5432`.

### Environment variables

- `PORT` - application port (default `3000`)
- `DATABASE_URL` - PostgreSQL connection URL
- `AUTH_SECRET` - secret used to sign the authentication cookie
- `FIRMS_MAP_KEY` - free MAP_KEY provided by NASA FIRMS to use the `/api/area/csv` endpoint
- `GOOGLE_GEOCODING_API_KEY` - Google Geocoding API key used to resolve city and state from coordinates

Use `.env.example` as a template for local configuration.

## Authentication

The authentication layer stores users in the dedicated table `auth_users`, with:

- `full_name`
- `email`
- `password_hash`
- `created_at`
- `updated_at`
- `last_login_at`

Passwords are never stored in plain text. Sessions are handled with signed HTTP-only cookies.

### Auth routes

- `POST /api/auth/signup` - creates an account and starts a session
- `POST /api/auth/signin` - authenticates an existing account
- `POST /api/auth/signout` - destroys the current session
- `GET /api/auth/session` - returns the authenticated user, when present

## Wildfire endpoints

- `GET /api/health` - checks whether the service is active
- `GET /api/fires/brazil?source=modis` - returns FIRMS data filtered for Brazil using MODIS.
- `GET /api/fires/brazil?source=viirs` - returns FIRMS data filtered for Brazil using VIIRS.
- `GET /api/fires/locations` - lists geocoded fire locations persisted in the database

## Screens

- `/sign-up` - user registration form
- `/sign-in` - user login form
- `/dashboard` - authenticated dashboard with account information and wildfire summaries

## Notes

- Data is retrieved directly from public FIRMS CSV sources.
- In-memory caching is applied for 15 minutes to reduce the number of downloads.
- HeroUI v3 is wired through `@heroui/react` and `@heroui/styles`, following the current Tailwind CSS v4 setup from the official documentation.
