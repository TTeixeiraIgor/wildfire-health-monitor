"use client";

import Link from 'next/link';
import { Button, Card } from '@heroui/react';
import { LogoutButton } from './logout-button.jsx';

function formatDate(value) {
  if (!value) {
    return 'Sem sincronizacao registrada';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function MetricCard({ label, value, detail }) {
  return (
    <Card className="border border-white/60 bg-white/85 shadow-lg shadow-slate-900/5">
      <Card.Content className="space-y-3 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
        <p className="metric-value text-4xl font-semibold text-slate-950">{value}</p>
        <p className="text-sm text-slate-600">{detail}</p>
      </Card.Content>
    </Card>
  );
}

export function DashboardView({ user, overview, recentLocations, healthSummary }) {
  return (
    <main className="app-shell page-grid relative isolate px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-slate-900/10 bg-slate-950 px-8 py-8 text-white shadow-2xl shadow-slate-950/20 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-emerald-200">
              Area autenticada
            </span>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">Ola, {user.fullName}.</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-300">
                Seu acesso foi persistido na tabela <code className="rounded bg-white/10 px-1.5 py-0.5">auth_users</code>.
                Abaixo voce encontra o resumo operacional dos dados ambientais e atalhos para as APIs.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{user.email}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Ultimo login: {formatDate(user.lastLoginAt || user.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button as={Link} href="/health-assessment">
              Nova triagem
            </Button>
            <Button as={Link} href="/api/auth/session" target="_blank" variant="secondary">
              Ver sessao
            </Button>
            <Button as={Link} href="/api/fires/locations" target="_blank" variant="secondary">
              Ver localizacoes
            </Button>
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Eventos armazenados na tabela fires."
            label="Focos totais"
            value={overview.total_fires ?? 0}
          />
          <MetricCard
            detail="Registros com cidade/estado resolvidos."
            label="Locais geocodificados"
            value={overview.total_locations ?? 0}
          />
          <MetricCard detail="Eventos FIRMS via MODIS." label="Fonte MODIS" value={overview.modis_fires ?? 0} />
          <MetricCard detail="Eventos FIRMS via VIIRS." label="Fonte VIIRS" value={overview.viirs_fires ?? 0} />
          <MetricCard
            detail="Triagens de saude enviadas pelo usuario autenticado."
            label="Triagens salvas"
            value={healthSummary.total_assessments ?? 0}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-white/60 bg-white/90 shadow-lg shadow-slate-900/5">
            <Card.Header className="flex flex-col gap-2 px-6 pt-6">
              <Card.Title className="text-2xl font-semibold text-slate-900">Ultimas localizacoes geocodificadas</Card.Title>
              <Card.Description className="text-sm leading-6 text-slate-600">
                A lista abaixo usa os dados ja persistidos pelo coletor FIRMS no PostgreSQL.
              </Card.Description>
            </Card.Header>
            <Card.Content className="px-6 pb-6">
              {recentLocations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
                  Nenhuma localizacao foi salva ainda. Assim que a coleta rodar, as cidades e estados aparecerao aqui.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLocations.map((location) => (
                    <article
                      key={location.fire_key}
                      className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:border-emerald-200 hover:bg-emerald-50/60"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {location.city || 'Cidade nao identificada'}
                            {location.state ? `, ${location.state}` : ''}
                          </p>
                          <p className="text-sm text-slate-600">{location.formatted_address || 'Endereco geocodificado indisponivel.'}</p>
                        </div>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                          {location.source}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                        <span>
                          Lat {Number(location.latitude).toFixed(3)} / Lon {Number(location.longitude).toFixed(3)}
                        </span>
                        <span>{formatDate(location.created_at)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          <Card className="border border-white/60 bg-white/90 shadow-lg shadow-slate-900/5">
            <Card.Header className="flex flex-col gap-2 px-6 pt-6">
              <Card.Title className="text-2xl font-semibold text-slate-900">APIs disponiveis</Card.Title>
              <Card.Description className="text-sm leading-6 text-slate-600">
                Os endpoints originais foram mantidos e agora convivem com a camada de autenticacao.
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4 px-6 pb-6">
              <div className="rounded-3xl bg-amber-50 px-4 py-4 text-sm text-amber-900">
                Ultima sincronizacao: <strong>{formatDate(overview.last_fire_sync)}</strong>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <code>GET /api/health</code>
                </p>
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <code>GET /api/fires/brazil?source=modis</code>
                </p>
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <code>GET /api/fires/brazil?source=viirs</code>
                </p>
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <code>GET /api/fires/locations</code>
                </p>
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <code>POST /api/auth/signup</code> e <code>POST /api/auth/signin</code>
                </p>
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <code>POST /api/health-assessments</code> para salvar triagens de saude associadas ao usuario
                </p>
              </div>
            </Card.Content>
          </Card>
        </section>
      </div>
    </main>
  );
}
