import { getCurrentUser } from '@/auth.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();

  return Response.json({
    authenticated: Boolean(user),
    user
  });
}
