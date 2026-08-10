import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/auth.js';
import { AuthForm } from '@/components/auth-form.jsx';
import { AuthShell } from '@/components/auth-shell.jsx';

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <AuthShell
      alternateHref="/sign-up"
      alternateLabel="Criar conta"
      description="Ainda nao possui acesso?"
      eyebrow="Sign in"
      title="Entrar"
    >
      <AuthForm mode="sign-in" />
    </AuthShell>
  );
}
