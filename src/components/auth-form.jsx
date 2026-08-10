"use client";

import { Button, Card, Input } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const FORM_COPY = {
  'sign-in': {
    title: 'Entrar na plataforma',
    description: 'Acesse a central operacional para consultar os dados de queimadas salvos na base.',
    submitLabel: 'Entrar',
    endpoint: '/api/auth/signin',
    successMessage: 'Login realizado. Redirecionando para o dashboard...'
  },
  'sign-up': {
    title: 'Criar nova conta',
    description: 'Cadastre um operador com e-mail e senha para habilitar o acesso autenticado ao sistema.',
    submitLabel: 'Criar conta',
    endpoint: '/api/auth/signup',
    successMessage: 'Conta criada com sucesso. Redirecionando para o dashboard...'
  }
};

function Field({ label, hint, children }) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function AuthForm({ mode }) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ error: '', success: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const copy = FORM_COPY[mode];
  const isSignup = mode === 'sign-up';
  const isBusy = isSubmitting || isPending;

  function updateField(field) {
    return (event) => {
      const value = event.target.value;
      setStatus({ error: '', success: '' });
      setForm((current) => ({ ...current, [field]: value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ error: '', success: '' });

    if (isSignup && form.password !== form.confirmPassword) {
      setIsSubmitting(false);
      setStatus({ error: 'As senhas informadas precisam ser iguais.', success: '' });
      return;
    }

    try {
      const response = await fetch(copy.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatus({ error: payload.error || 'Nao foi possivel concluir a autenticacao.', success: '' });
        return;
      }

      setStatus({ error: '', success: copy.successMessage });
      startTransition(() => {
        router.replace('/dashboard');
        router.refresh();
      });
    } catch (error) {
      setStatus({
        error: error instanceof Error ? error.message : 'Falha de rede ao enviar os dados de autenticacao.',
        success: ''
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="glass-panel w-full border border-white/60 bg-white/85 shadow-2xl shadow-emerald-950/10">
      <Card.Header className="flex flex-col gap-3 px-8 pt-8">
        <div className="space-y-2">
          <Card.Title className="text-3xl font-semibold tracking-tight text-slate-900">{copy.title}</Card.Title>
          <Card.Description className="text-sm leading-6 text-slate-600">{copy.description}</Card.Description>
        </div>
      </Card.Header>

      <Card.Content className="px-8 pb-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {isSignup ? (
            <Field label="Nome completo" hint="Esse nome sera exibido no dashboard.">
              <Input
                aria-label="Nome completo"
                autoComplete="name"
                fullWidth
                name="fullName"
                placeholder="Ex.: Maria Silva"
                required
                value={form.fullName}
                onChange={updateField('fullName')}
              />
            </Field>
          ) : null}

          <Field label="E-mail" hint="Usaremos esse endereco como identificador unico da conta.">
            <Input
              aria-label="E-mail"
              autoComplete="email"
              fullWidth
              name="email"
              placeholder="voce@organizacao.org"
              required
              type="email"
              value={form.email}
              onChange={updateField('email')}
            />
          </Field>

          <Field label="Senha" hint="Minimo de 8 caracteres. A senha fica salva apenas em formato hash.">
            <Input
              aria-label="Senha"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              fullWidth
              name="password"
              placeholder="Digite sua senha"
              required
              type="password"
              value={form.password}
              onChange={updateField('password')}
            />
          </Field>

          {isSignup ? (
            <Field label="Confirmar senha">
              <Input
                aria-label="Confirmar senha"
                autoComplete="new-password"
                fullWidth
                name="confirmPassword"
                placeholder="Repita a senha"
                required
                type="password"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
              />
            </Field>
          ) : null}

          {status.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {status.error}
            </div>
          ) : null}

          {status.success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {status.success}
            </div>
          ) : null}

          <Button className="w-full" disabled={isBusy} type="submit">
            {isBusy ? 'Processando...' : copy.submitLabel}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
