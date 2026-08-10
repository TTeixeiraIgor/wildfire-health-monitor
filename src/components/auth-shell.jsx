import Link from 'next/link';

export function AuthShell({ eyebrow, title, description, children, alternateHref, alternateLabel }) {
  return (
    <main className="app-shell page-grid relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.25),transparent_60%)]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-slate-900/10 bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-950/20">
          <div className="space-y-6">
            <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-amber-200">
              Wildfire Health Monitor
            </span>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">{eyebrow}</p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Gestao de acessos e dados ambientais em uma unica interface.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Faca login para consultar focos de incendio, acompanhar localidades geocodificadas e operar o
                monitoramento com uma experiencia moderna em Next.js e HeroUI.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center gap-4">
          {children}
          <p className="text-center text-sm text-slate-600">
            {description}{' '}
            <Link className="font-semibold text-emerald-700 transition hover:text-emerald-900" href={alternateHref}>
              {alternateLabel}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
