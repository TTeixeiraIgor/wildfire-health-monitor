import { Pool } from 'pg';

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
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to save fire records:', error.message);
  } finally {
    client.release();
  }
}

export default pool;
