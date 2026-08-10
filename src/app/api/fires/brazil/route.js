import { fetchBrazilFires } from '@/firms-service.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get('source') || 'modis').toLowerCase();

  try {
    const fires = await fetchBrazilFires(source);
    return Response.json({ source, country: 'Brazil', count: fires.length, fires });
  } catch (error) {
    const status = error.message?.startsWith('Invalid source') ? 400 : 500;
    return Response.json(
      {
        error: error.message || 'Failed to fetch fire data from FIRMS.'
      },
      { status }
    );
  }
}
