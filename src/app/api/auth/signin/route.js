import { authenticateUser, createSession, validateSigninPayload } from '@/auth.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const payload = await request.json();
    const validation = validateSigninPayload(payload);

    if (!validation.ok) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const user = await authenticateUser(validation.value);
    if (!user) {
      return Response.json({ error: 'Credenciais invalidas.' }, { status: 401 });
    }

    await createSession(user);

    return Response.json({
      message: 'Login realizado com sucesso.',
      user
    });
  } catch (error) {
    return Response.json(
      {
        error: error.message || 'Nao foi possivel autenticar o usuario.'
      },
      { status: 500 }
    );
  }
}
