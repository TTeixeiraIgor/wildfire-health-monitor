import { createSession, registerUser, validateSignupPayload } from '@/auth.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const payload = await request.json();
    const validation = validateSignupPayload(payload);

    if (!validation.ok) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const user = await registerUser(validation.value);
    await createSession(user);

    return Response.json(
      {
        message: 'Conta criada com sucesso.',
        user
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'Ja existe um usuario cadastrado com este e-mail.' }, { status: 409 });
    }

    return Response.json(
      {
        error: error.message || 'Nao foi possivel criar a conta.'
      },
      { status: 500 }
    );
  }
}
