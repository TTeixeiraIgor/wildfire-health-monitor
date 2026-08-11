import { getCurrentUser } from '@/auth.js';
import { saveHealthAssessment, validateHealthAssessmentPayload } from '@/health-assessment.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Sessao invalida. Faca login novamente.' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const validation = validateHealthAssessmentPayload(payload);

    if (!validation.ok) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const assessment = await saveHealthAssessment(user.id, validation.value);

    return Response.json(
      {
        message: 'Triagem de saude salva com sucesso.',
        assessment
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        error: error.message || 'Nao foi possivel salvar a triagem de saude.'
      },
      { status: 500 }
    );
  }
}
