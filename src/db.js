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

const AUTH_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS auth_users (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
  );
`;

const AUTH_USERS_EMAIL_INDEX = `
  CREATE UNIQUE INDEX IF NOT EXISTS auth_users_email_unique_idx
  ON auth_users (LOWER(email));
`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wildfire',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

let initPromise = null;

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
  if (!initPromise) {
    initPromise = (async () => {
      await waitForDbReady();

      const createFiresTable = `
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

      await pool.query(createFiresTable);
      await pool.query(FIRE_LOCATION_TABLE);
      await pool.query(AUTH_USERS_TABLE);
      await pool.query(AUTH_USERS_EMAIL_INDEX);
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

function buildFireKey(fire) {
  return `${fire.source}:${fire.acq_date}:${fire.acq_time}:${fire.latitude}:${fire.longitude}:${fire.satellite}:${fire.instrument}`;
}

export async function saveBrazilFires(source, fires) {
  await initDb();

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

export async function listGeocodedLocations(limit) {
  await initDb();

  const hasLimit = Number.isInteger(limit) && limit > 0;
  const query = `
    SELECT fire_key, source, latitude, longitude, city, state, country, formatted_address, created_at
    FROM fire_locations
    ORDER BY created_at DESC
    ${hasLimit ? 'LIMIT $1' : ''}
  `;
  const result = hasLimit ? await pool.query(query, [limit]) : await pool.query(query);
  return result.rows;
}

export async function createAuthUser({ fullName, email, passwordHash }) {
  await initDb();

  const result = await pool.query(
    `
      INSERT INTO auth_users (full_name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, email, created_at, updated_at, last_login_at
    `,
    [fullName.trim(), email.trim().toLowerCase(), passwordHash]
  );

  return result.rows[0];
}

export async function findAuthUserByEmail(email) {
  await initDb();

  const result = await pool.query(
    `
      SELECT id, full_name, email, password_hash, created_at, updated_at, last_login_at
      FROM auth_users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email.trim()]
  );

  return result.rows[0] || null;
}

export async function findAuthUserById(id) {
  await initDb();

  const result = await pool.query(
    `
      SELECT id, full_name, email, password_hash, created_at, updated_at, last_login_at
      FROM auth_users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function touchAuthUserLogin(id) {
  await initDb();

  const result = await pool.query(
    `
      UPDATE auth_users
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING id, full_name, email, created_at, updated_at, last_login_at
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function getFireOverview() {
  await initDb();

  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::INT FROM fires) AS total_fires,
      (SELECT COUNT(*)::INT FROM fire_locations) AS total_locations,
      (SELECT COUNT(*)::INT FROM fires WHERE source = 'modis') AS modis_fires,
      (SELECT COUNT(*)::INT FROM fires WHERE source = 'viirs') AS viirs_fires,
      (SELECT MAX(created_at) FROM fires) AS last_fire_sync
  `);

  return result.rows[0];
}

export default pool;
