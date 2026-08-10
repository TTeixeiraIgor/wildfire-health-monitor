import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/auth.js';
import { AuthForm } from '@/components/auth-form.jsx';
import { AuthShell } from '@/components/auth-shell.jsx';

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <AuthShell
      alternateHref="/sign-in"
      alternateLabel="Entrar com conta existente"
      description="Ja tem uma conta?"
      eyebrow="Sign up"
      title="Criar conta"
    >
      <AuthForm mode="sign-up" />
    </AuthShell>
  );
}
