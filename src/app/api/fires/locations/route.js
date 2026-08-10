import { listGeocodedLocations } from '@/db.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const locations = await listGeocodedLocations();
    return Response.json({ count: locations.length, locations });
  } catch (error) {
    return Response.json(
      {
        error: error.message || 'Failed to fetch geocoded locations.'
      },
      { status: 500 }
    );
  }
}
