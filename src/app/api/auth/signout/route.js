import { clearSession } from '@/auth.js';

export const dynamic = 'force-dynamic';

export async function POST() {
  await clearSession();
  return Response.json({ message: 'Sessao encerrada com sucesso.' });
}
