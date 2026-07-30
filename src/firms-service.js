import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { saveBrazilFires } from './db.js';
import { geocodeBrazilLocation } from './geocoding.js';

const FIRMS_API_BASE = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
const FIRMS_SOURCES = {
  modis: 'MODIS_NRT',
  viirs: 'VIIRS_SNPP_NRT'
};

const BRAZIL_BOUNDS = {
  minLat: -34.0,
  maxLat: 6.0,
  minLon: -74.0,
  maxLon: -34.0
};

const cache = {
  timestamp: 0,
  source: null,
  data: []
};
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

function isBrazilFire(record) {
  const latitude = parseFloat(record.latitude);
  const longitude = parseFloat(record.longitude);
  return (
    latitude >= BRAZIL_BOUNDS.minLat &&
    latitude <= BRAZIL_BOUNDS.maxLat &&
    longitude >= BRAZIL_BOUNDS.minLon &&
    longitude <= BRAZIL_BOUNDS.maxLon
  );
}

export async function fetchBrazilFires(source = 'modis') {
  source = source.toLowerCase();
  const firsSource = FIRMS_SOURCES[source];
  if (!firsSource) {
    throw new Error(`Invalid source '${source}'. Use 'modis' or 'viirs'.`);
  }

  const now = Date.now();
  if (cache.source === source && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) {
    throw new Error('FIRMS_MAP_KEY is not configured. Register a free MAP_KEY at https://firms.modaps.eosdis.nasa.gov/api/ and set it in the environment.');
  }

  const area = '-74.0,-34.0,-34.0,6.0';
  const endpoint = `${FIRMS_API_BASE}/${mapKey}/${firsSource}/${encodeURIComponent(area)}/1`;

  const response = await axios.get(endpoint, {
    responseType: 'text',
    timeout: 20000,
    headers: {
      'User-Agent': 'wildfire-health-monitor/1.0'
    }
  });

  if (!response.data || response.data.includes('Invalid MAP_KEY') || response.data.includes('Error')) {
    throw new Error(`Unable to fetch FIRMS data for source '${source}'. Check FIRMS_MAP_KEY and endpoint permissions.`);
  }

  const records = parse(response.data, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const brazilFires = records
    .filter(isBrazilFire)
    .map((record) => ({
      source,
      confidence: record.confidence,
      latitude: parseFloat(record.latitude),
      longitude: parseFloat(record.longitude),
      brightness: parseFloat(record.brightness),
      acq_date: record.acq_date,
      acq_time: record.acq_time,
      satellite: record.satellite,
      instrument: record.instrument,
      version: record.version,
      bright_t31: record.bright_t31,
      frp: record.frp,
      daynight: record.daynight
    }));

  for (const fire of brazilFires) {
    fire.location = await geocodeBrazilLocation({ latitude: fire.latitude, longitude: fire.longitude });
  }

  await saveBrazilFires(source, brazilFires);

  cache.source = source;
  cache.timestamp = now;
  cache.data = brazilFires;
  return brazilFires;
}
