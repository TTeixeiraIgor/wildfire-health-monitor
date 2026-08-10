import { initDb } from '@/db.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  await initDb();

  return Response.json({
    status: 'ok',
    service: 'wildfire-health-monitor',
    frontend: 'nextjs',
    auth: 'enabled'
  });
}
