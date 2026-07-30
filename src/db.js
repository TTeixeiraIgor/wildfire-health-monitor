import { Pool } from 'pg';

const FIRE_LOCATION_TABLE = `
  CREATE TABLE IF NOT EXISTS fire_locations (
    id SERIAL PRIMARY KEY,
    fire_key TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT,
    formatted_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wildfire',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

async function waitForDbReady(attempts = 0) {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    if (attempts >= 12) {
      throw new Error(`Unable to connect to database after ${attempts} attempts: ${error.message}`);
    }
    console.log(`Waiting for Postgres (${attempts + 1}/12)...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return waitForDbReady(attempts + 1);
  }
}

export async function initDb() {
  await waitForDbReady();

  const createTable = `
    CREATE TABLE IF NOT EXISTS fires (
      id SERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      acq_date DATE NOT NULL,
      acq_time TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      brightness DOUBLE PRECISION,
      confidence TEXT,
      satellite TEXT,
      instrument TEXT,
      version TEXT,
      bright_t31 TEXT,
      frp TEXT,
      daynight TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(source, acq_date, acq_time, latitude, longitude, satellite, instrument)
    );
  `;

  await pool.query(createTable);
  await pool.query(FIRE_LOCATION_TABLE);
}

function buildFireKey(fire) {
  return `${fire.source}:${fire.acq_date}:${fire.acq_time}:${fire.latitude}:${fire.longitude}:${fire.satellite}:${fire.instrument}`;
}

export async function saveBrazilFires(source, fires) {
  if (!fires || fires.length === 0) {
    return;
  }

  const insertQuery = `
    INSERT INTO fires (
      source, acq_date, acq_time, latitude, longitude, brightness, confidence,
      satellite, instrument, version, bright_t31, frp, daynight
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (source, acq_date, acq_time, latitude, longitude, satellite, instrument) DO NOTHING
  `;

  const locationInsertQuery = `
    INSERT INTO fire_locations (
      fire_key, source, latitude, longitude, city, state, country, formatted_address
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (fire_key) DO UPDATE SET
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      formatted_address = EXCLUDED.formatted_address,
      created_at = NOW()
  `;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const fire of fires) {
      await client.query(insertQuery, [
        fire.source,
        fire.acq_date,
        fire.acq_time,
        fire.latitude,
        fire.longitude,
        fire.brightness,
        fire.confidence,
        fire.satellite,
        fire.instrument,
        fire.version,
        fire.bright_t31,
        fire.frp,
        fire.daynight
      ]);

      const location = fire.location || null;
      if (location) {
        await client.query(locationInsertQuery, [
          buildFireKey(fire),
          fire.source,
          fire.latitude,
          fire.longitude,
          location.city || null,
          location.state || null,
          location.country || null,
          location.formatted_address || null
        ]);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to save fire records:', error.message);
  } finally {
    client.release();
  }
}

export async function listGeocodedLocations() {
  const result = await pool.query(`
    SELECT fire_key, source, latitude, longitude, city, state, country, formatted_address, created_at
    FROM fire_locations
    ORDER BY created_at DESC
  `);
  return result.rows;
}

export default pool;
