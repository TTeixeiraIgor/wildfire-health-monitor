import axios from 'axios';

const GOOGLE_GEOCODING_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';
const cache = new Map();

function normalizeLocation(result) {
  const addressComponents = result?.address_components || [];
  const city =
    addressComponents.find((component) => component.types.includes('locality'))?.long_name ||
    addressComponents.find((component) => component.types.includes('administrative_area_level_2'))?.long_name ||
    addressComponents.find((component) => component.types.includes('postal_town'))?.long_name ||
    null;

  const state =
    addressComponents.find((component) => component.types.includes('administrative_area_level_1'))?.long_name ||
    null;

  const countryComponent = addressComponents.find((component) => component.types.includes('country'));
  const country = countryComponent?.long_name || null;
  const countryCode = countryComponent?.short_name || null;

  return {
    city,
    state,
    country,
    countryCode,
    formatted_address: result?.formatted_address || null
  };
}

export async function geocodeBrazilLocation({ latitude, longitude }) {
  if (!process.env.GOOGLE_GEOCODING_API_KEY) {
    return null;
  }

  const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  try {
    const response = await axios.get(GOOGLE_GEOCODING_BASE, {
      params: {
        latlng: key,
        key: process.env.GOOGLE_GEOCODING_API_KEY,
        language: 'pt-BR',
        result_type: 'administrative_area_level_1,administrative_area_level_2,locality,postal_town'
      },
      timeout: 15000
    });

    const results = response.data?.results || [];
    const brazilResult = results.find((result) => {
      const countryComponent = result?.address_components?.find((component) => component.types.includes('country'));
      return countryComponent?.short_name === 'BR';
    });

    const location = brazilResult ? normalizeLocation(brazilResult) : null;
    cache.set(key, location);
    return location;
  } catch (error) {
    console.error('Google geocoding failed:', error.message);
    cache.set(key, null);
    return null;
  }
}
