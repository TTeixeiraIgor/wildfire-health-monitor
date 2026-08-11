"use client";

import Link from 'next/link';
import {
  Button,
  Card,
  Checkbox,
  Input,
  Radio,
  RadioGroup,
  TextArea
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const DIAGNOSES_OPTIONS = [
  ['asthma', 'Asma'],
  ['bronchitis', 'Bronquite alergica'],
  ['copd', 'DPOC ou enfisema'],
  ['rhinitis', 'Rinite alergica'],
  ['sinusitis', 'Sinusite cronica'],
  ['frequent_pneumonia', 'Pneumonia frequente'],
  ['srag_history', 'Historico de SRAG'],
  ['cardiovascular_disease', 'Doenca cardiovascular'],
  ['hypertension', 'Hipertensao']
];

const RESPIRATORY_OPTIONS = [
  ['dry_cough', 'Tosse seca'],
  ['productive_cough', 'Tosse com secrecao'],
  ['shortness_of_breath', 'Falta de ar'],
  ['wheezing', 'Chiado no peito'],
  ['chest_pain', 'Dor ou aperto no peito'],
  ['rapid_breathing', 'Respiracao curta ou rapida']
];

const MUCOSAL_OPTIONS = [
  ['eye_irritation', 'Ardor ou irritacao nos olhos'],
  ['eye_redness', 'Vermelhidao ocular'],
  ['runny_nose', 'Coriza'],
  ['nasal_obstruction', 'Obstrucao nasal'],
  ['sore_throat', 'Dor de garganta']
];

const SYSTEMIC_OPTIONS = [
  ['headache', 'Dor de cabeca'],
  ['dizziness', 'Tontura'],
  ['fatigue', 'Cansaco ou fadiga excessiva']
];

const OCCUPATIONAL_OPTIONS = [
  ['outdoor_work', 'Trabalho ao ar livre'],
  ['rural_burn_area', 'Area rural proxima a queimadas'],
  ['dust', 'Exposicao a poeira'],
  ['chemicals', 'Exposicao a produtos quimicos'],
  ['none', 'Sem exposicao ocupacional relevante']
];

const HOUSEHOLD_OPTIONS = [
  ['wood_stove', 'Uso de fogao a lenha'],
  ['mold', 'Presenca de mofo'],
  ['dust', 'Poeira recorrente'],
  ['air_conditioning', 'Uso frequente de ar-condicionado'],
  ['indoor_smokers', 'Convive com fumantes em casa'],
  ['none', 'Nenhum fator intradomiciliar relevante']
];

const MEDICATION_OPTIONS = [
  ['inhaled_corticosteroids', 'Corticoides inalatorios'],
  ['bronchodilators', 'Broncodilatadores ou bombinhas'],
  ['antihistamines', 'Anti-histaminicos'],
  ['oxygen_therapy', 'Oxigenoterapia'],
  ['other', 'Outros medicamentos continuos']
];

const CARE_OPTIONS = [
  ['none', 'Nao procurou atendimento'],
  ['primary_care', 'Posto de saude'],
  ['vigiar_unit', 'Unidade Sentinela do VIGIAR'],
  ['upa', 'UPA'],
  ['hospital', 'Hospital'],
  ['telehealth', 'Teleatendimento']
];

const STEPS = [
  {
    id: 'symptoms',
    eyebrow: 'Etapa 1',
    title: 'Sintomas e localizacao',
    description: 'Comecamos pelo que voce sente hoje e pela regiao onde mora ou trabalha.'
  },
  {
    id: 'history',
    eyebrow: 'Etapa 2',
    title: 'Historico clinico',
    description: 'Agora mapeamos fatores de vulnerabilidade biologica e doencas pre-existentes.'
  },
  {
    id: 'exposure',
    eyebrow: 'Etapa 3',
    title: 'Exposicao e medicamentos',
    description: 'Essas respostas ajudam a relacionar seus sintomas com o ambiente e seu plano de acao.'
  },
  {
    id: 'consent',
    eyebrow: 'Etapa 4',
    title: 'Consentimento e envio',
    description: 'Fechamos com os termos da LGPD e a finalidade do uso dos dados sensiveis.'
  }
];

function formatDate(value) {
  if (!value) {
    return 'Ainda nao enviado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function MultiSelectGroup({ label, options, selectedValues, onToggle, hint }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {options.map(([value, text]) => (
          <Checkbox key={value} isSelected={selectedValues.includes(value)} onChange={() => onToggle(value)}>
            {text}
          </Checkbox>
        ))}
      </div>
    </div>
  );
}

function defaultFormState() {
  return {
    birthDate: '',
    age: '',
    pregnancyStatus: 'not_applicable',
    postalCode: '',
    neighborhood: '',
    city: '',
    state: '',
    currentlySymptomatic: true,
    respiratorySymptoms: [],
    mucosalSymptoms: [],
    systemicSymptoms: [],
    symptomStartedAt: '',
    symptomIntensity: '3',
    symptomSeverity: 'moderada',
    smokePerception: 'smell',
    outdoorActivityFrequency: '1_2_days',
    outdoorMinutesPerDay: '30',
    smokingStatus: 'never',
    diagnoses: [],
    occupationalExposures: [],
    householdExposures: [],
    continuousMedications: [],
    rescueMedication24h: '0',
    rescueMedicationWeek: '0',
    recentCareServices: [],
    hospitalizedLastYear: false,
    dataUsePurpose: 'both',
    consentAccepted: false,
    anonymizationAccepted: false,
    additionalNotes: ''
  };
}

function buildUrgencyHint(form) {
  if (!form.currentlySymptomatic) {
    return null;
  }

  const hasAlarmSymptom =
    form.respiratorySymptoms.includes('shortness_of_breath') ||
    form.respiratorySymptoms.includes('chest_pain') ||
    form.respiratorySymptoms.includes('rapid_breathing');

  if (form.symptomSeverity === 'grave' || form.symptomIntensity === '5' || hasAlarmSymptom) {
    return 'Se houver piora da falta de ar, dor no peito ou respiracao muito rapida, procure atendimento urgente imediatamente.';
  }

  return null;
}

export function HealthAssessmentExperience({ user, summary, recentAssessments }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(defaultFormState);
  const [status, setStatus] = useState({ error: '', success: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const urgencyHint = buildUrgencyHint(form);

  function setField(field, value) {
    setStatus({ error: '', success: '' });
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleList(field, value) {
    setStatus({ error: '', success: '' });
    setForm((current) => {
      const values = current[field];
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      const sanitizedValues =
        value === 'none' && !values.includes('none')
          ? ['none']
          : nextValues.filter((item) => item !== 'none' || nextValues.length === 1);

      return {
        ...current,
        [field]: sanitizedValues
      };
    });
  }

  function nextStep() {
    setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
  }

  function previousStep() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ error: '', success: '' });

    try {
      const response = await fetch('/api/health-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          outdoorMinutesPerDay: Number.parseInt(form.outdoorMinutesPerDay || '0', 10),
          rescueMedication24h: Number.parseInt(form.rescueMedication24h || '0', 10),
          rescueMedicationWeek: Number.parseInt(form.rescueMedicationWeek || '0', 10),
          age: form.age ? Number.parseInt(form.age, 10) : null
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatus({ error: payload.error || 'Nao foi possivel salvar a triagem.', success: '' });
        return;
      }

      setStatus({
        error: '',
        success: `Triagem salva com sucesso. Nivel de risco registrado: ${payload.assessment.risk_level}.`
      });
      setForm(defaultFormState());
      setCurrentStep(0);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus({
        error: error instanceof Error ? error.message : 'Falha inesperada ao enviar a triagem.',
        success: ''
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell page-grid relative isolate px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-[2rem] border border-slate-900/10 bg-slate-950 px-8 py-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-emerald-200">
                Triagem de saude e bem-estar
              </span>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight">Formulario progressivo para exposicao, sintomas e risco.</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-300">
                  As respostas de <strong>{user.fullName}</strong> ficam associadas ao seu usuario autenticado e
                  podem ser cruzadas com dados ambientais da sua regiao de forma anonimizada.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button as={Link} href="/dashboard" variant="secondary">
                Voltar ao dashboard
              </Button>
              <Button as={Link} href="/api/auth/session" target="_blank" variant="secondary">
                Ver sessao
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border border-white/60 bg-white/90 shadow-lg shadow-slate-900/5">
            <Card.Content className="space-y-2 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Triagens enviadas</p>
              <p className="metric-value text-4xl font-semibold text-slate-950">{summary.total_assessments ?? 0}</p>
              <p className="text-sm text-slate-600">Respostas sensiveis salvas em tabela dedicada para acompanhamento individual.</p>
            </Card.Content>
          </Card>
          <Card className="border border-white/60 bg-white/90 shadow-lg shadow-slate-900/5">
            <Card.Content className="space-y-2 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Ultimo envio</p>
              <p className="text-2xl font-semibold text-slate-950">{formatDate(summary.latest_submission_at)}</p>
              <p className="text-sm text-slate-600">Use novas submissoes para registrar mudancas de sintomas ou exposicao.</p>
            </Card.Content>
          </Card>
          <Card className="border border-white/60 bg-white/90 shadow-lg shadow-slate-900/5">
            <Card.Content className="space-y-2 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Risco mais recente</p>
              <p className="text-2xl font-semibold text-slate-950">{summary.latest_risk_level || 'Sem classificacao'}</p>
              <p className="text-sm text-slate-600">A classificacao combina sintomas, comorbidades e vulnerabilidade biologica.</p>
            </Card.Content>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="border border-white/60 bg-white/92 shadow-xl shadow-slate-900/5">
            <Card.Header className="flex flex-col gap-6 px-8 pt-8">
              <div className="flex flex-wrap items-center gap-3">
                {STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      index === currentStep
                        ? 'bg-slate-950 text-white'
                        : index < currentStep
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                  >
                    {index + 1}. {step.title}
                  </button>
                ))}
              </div>
              <SectionHeading
                description={STEPS[currentStep].description}
                eyebrow={STEPS[currentStep].eyebrow}
                title={STEPS[currentStep].title}
              />
            </Card.Header>

            <Card.Content className="px-8 pb-8">
              <form className="space-y-8" onSubmit={handleSubmit}>
                {currentStep === 0 ? (
                  <div className="space-y-8">
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field label="CEP" hint="Usado para cruzar seus dados com a qualidade do ar da regiao.">
                        <Input
                          aria-label="CEP"
                          fullWidth
                          placeholder="00000-000"
                          value={form.postalCode}
                          onChange={(event) => setField('postalCode', event.target.value)}
                        />
                      </Field>
                      <Field label="Bairro">
                        <Input
                          aria-label="Bairro"
                          fullWidth
                          placeholder="Seu bairro"
                          value={form.neighborhood}
                          onChange={(event) => setField('neighborhood', event.target.value)}
                        />
                      </Field>
                      <Field label="Municipio">
                        <Input
                          aria-label="Municipio"
                          fullWidth
                          placeholder="Sua cidade"
                          value={form.city}
                          onChange={(event) => setField('city', event.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
                      <Field label="UF">
                        <Input
                          aria-label="UF"
                          fullWidth
                          maxLength={2}
                          placeholder="Ex.: SP"
                          value={form.state}
                          onChange={(event) => setField('state', event.target.value.toUpperCase())}
                        />
                      </Field>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">Voce esta com sintomas agora?</p>
                        <RadioGroup
                          orientation="horizontal"
                          value={form.currentlySymptomatic ? 'yes' : 'no'}
                          onChange={(value) => setField('currentlySymptomatic', value === 'yes')}
                        >
                          <Radio value="yes">Sim</Radio>
                          <Radio value="no">Nao</Radio>
                        </RadioGroup>
                      </div>
                    </div>

                    {form.currentlySymptomatic ? (
                      <div className="space-y-6 rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-6">
                        <div className="grid gap-5 md:grid-cols-3">
                          <Field label="Inicio dos sintomas" hint="Informe a data e hora aproximadas.">
                            <Input
                              aria-label="Inicio dos sintomas"
                              fullWidth
                              type="datetime-local"
                              value={form.symptomStartedAt}
                              onChange={(event) => setField('symptomStartedAt', event.target.value)}
                            />
                          </Field>
                          <Field label="Intensidade de 1 a 5">
                            <Input
                              aria-label="Intensidade de 1 a 5"
                              fullWidth
                              max={5}
                              min={1}
                              type="number"
                              value={form.symptomIntensity}
                              onChange={(event) => setField('symptomIntensity', event.target.value)}
                            />
                          </Field>
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-slate-700">Gravidade percebida</p>
                            <RadioGroup value={form.symptomSeverity} onChange={(value) => setField('symptomSeverity', value)}>
                              <Radio value="leve">Leve</Radio>
                              <Radio value="moderada">Moderada</Radio>
                              <Radio value="grave">Grave</Radio>
                            </RadioGroup>
                          </div>
                        </div>

                        <MultiSelectGroup
                          hint="Marque todos os sintomas respiratorios presentes."
                          label="Sintomas respiratorios"
                          options={RESPIRATORY_OPTIONS}
                          selectedValues={form.respiratorySymptoms}
                          onToggle={(value) => toggleList('respiratorySymptoms', value)}
                        />
                        <MultiSelectGroup
                          hint="Esses sinais podem acompanhar exposicao a fumaca e poluentes."
                          label="Irritacao de mucosas"
                          options={MUCOSAL_OPTIONS}
                          selectedValues={form.mucosalSymptoms}
                          onToggle={(value) => toggleList('mucosalSymptoms', value)}
                        />
                        <MultiSelectGroup
                          label="Sintomas sistemicos"
                          options={SYSTEMIC_OPTIONS}
                          selectedValues={form.systemicSymptoms}
                          onToggle={(value) => toggleList('systemicSymptoms', value)}
                        />
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-6 text-sm leading-6 text-emerald-900">
                        Sem sintomas no momento. Ainda assim, suas respostas ajudam a gerar um baseline para alertas personalizados.
                      </div>
                    )}
                  </div>
                ) : null}

                {currentStep === 1 ? (
                  <div className="space-y-8">
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field label="Data de nascimento">
                        <Input
                          aria-label="Data de nascimento"
                          fullWidth
                          type="date"
                          value={form.birthDate}
                          onChange={(event) => setField('birthDate', event.target.value)}
                        />
                      </Field>
                      <Field label="Idade" hint="Pode ser usada quando a data de nascimento nao estiver disponivel.">
                        <Input
                          aria-label="Idade"
                          fullWidth
                          max={120}
                          min={0}
                          type="number"
                          value={form.age}
                          onChange={(event) => setField('age', event.target.value)}
                        />
                      </Field>
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">Gestacao</p>
                        <RadioGroup value={form.pregnancyStatus} onChange={(value) => setField('pregnancyStatus', value)}>
                          <Radio value="yes">Gestante</Radio>
                          <Radio value="no">Nao gestante</Radio>
                          <Radio value="not_applicable">Nao se aplica</Radio>
                        </RadioGroup>
                      </div>
                    </div>

                    <MultiSelectGroup
                      hint="Informe diagnosticos medicos previos ou comorbidades relevantes."
                      label="Historico clinico e doencas pre-existentes"
                      options={DIAGNOSES_OPTIONS}
                      selectedValues={form.diagnoses}
                      onToggle={(value) => toggleList('diagnoses', value)}
                    />
                  </div>
                ) : null}

                {currentStep === 2 ? (
                  <div className="space-y-8">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                        <p className="text-sm font-medium text-slate-700">Percepcao de fumaca ou poluicao</p>
                        <RadioGroup value={form.smokePerception} onChange={(value) => setField('smokePerception', value)}>
                          <Radio value="none">Nao percebo sinais</Radio>
                          <Radio value="smell">Cheiro de fumaca</Radio>
                          <Radio value="dry_haze">Nevoa seca ou poluicao visivel</Radio>
                          <Radio value="nearby_fire">Queimadas proximas</Radio>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                        <p className="text-sm font-medium text-slate-700">Atividades ao ar livre</p>
                        <RadioGroup
                          value={form.outdoorActivityFrequency}
                          onChange={(value) => setField('outdoorActivityFrequency', value)}
                        >
                          <Radio value="rarely">Raramente</Radio>
                          <Radio value="1_2_days">1 a 2 dias por semana</Radio>
                          <Radio value="3_5_days">3 a 5 dias por semana</Radio>
                          <Radio value="daily">Diariamente</Radio>
                        </RadioGroup>
                        <Field label="Tempo medio diario ao ar livre (minutos)">
                          <Input
                            aria-label="Tempo medio diario ao ar livre"
                            fullWidth
                            min={0}
                            type="number"
                            value={form.outdoorMinutesPerDay}
                            onChange={(event) => setField('outdoorMinutesPerDay', event.target.value)}
                          />
                        </Field>
                      </div>
                    </div>

                    <MultiSelectGroup
                      label="Exposicao ocupacional"
                      options={OCCUPATIONAL_OPTIONS}
                      selectedValues={form.occupationalExposures}
                      onToggle={(value) => toggleList('occupationalExposures', value)}
                    />
                    <MultiSelectGroup
                      label="Ambiente intradomiciliar"
                      options={HOUSEHOLD_OPTIONS}
                      selectedValues={form.householdExposures}
                      onToggle={(value) => toggleList('householdExposures', value)}
                    />

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                        <p className="text-sm font-medium text-slate-700">Historico de tabagismo</p>
                        <RadioGroup value={form.smokingStatus} onChange={(value) => setField('smokingStatus', value)}>
                          <Radio value="never">Nunca fumou</Radio>
                          <Radio value="active">Fumante ativo</Radio>
                          <Radio value="former">Ex-fumante</Radio>
                          <Radio value="passive">Fumante passivo</Radio>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                        <p className="text-sm font-medium text-slate-700">Uso do sistema de saude</p>
                        <MultiSelectGroup
                          label="Atendimentos recentes por crise respiratoria"
                          options={CARE_OPTIONS}
                          selectedValues={form.recentCareServices}
                          onToggle={(value) => toggleList('recentCareServices', value)}
                        />
                        <Checkbox
                          isSelected={form.hospitalizedLastYear}
                          onChange={(isSelected) => setField('hospitalizedLastYear', isSelected)}
                        >
                          Ja foi internado por agravos respiratorios no ultimo ano
                        </Checkbox>
                      </div>
                    </div>

                    <MultiSelectGroup
                      label="Medicamentos de uso continuo"
                      options={MEDICATION_OPTIONS}
                      selectedValues={form.continuousMedications}
                      onToggle={(value) => toggleList('continuousMedications', value)}
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Uso de medicacao de resgate nas ultimas 24h">
                        <Input
                          aria-label="Uso de medicacao de resgate nas ultimas 24h"
                          fullWidth
                          min={0}
                          type="number"
                          value={form.rescueMedication24h}
                          onChange={(event) => setField('rescueMedication24h', event.target.value)}
                        />
                      </Field>
                      <Field label="Uso de medicacao de resgate na ultima semana">
                        <Input
                          aria-label="Uso de medicacao de resgate na ultima semana"
                          fullWidth
                          min={0}
                          type="number"
                          value={form.rescueMedicationWeek}
                          onChange={(event) => setField('rescueMedicationWeek', event.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                ) : null}

                {currentStep === 3 ? (
                  <div className="space-y-8">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
                      <SectionHeading
                        description="Seus dados de saude sao dados pessoais sensiveis. Este consentimento explica a finalidade da coleta e o compromisso com anonimizacao quando houver cruzamento com dados ambientais."
                        eyebrow="LGPD"
                        title="Termo de consentimento"
                      />
                      <div className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
                        <p>
                          As informacoes coletadas serao usadas para gerar alertas personalizados, apoiar analises de exposicao ambiental e pesquisa epidemiologica com dados agregados e anonimizados.
                        </p>
                        <p>
                          Este formulario nao substitui avaliacao medica. Em caso de agravamento, busque atendimento presencial imediatamente.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                      <p className="text-sm font-medium text-slate-700">Finalidade principal do uso dos dados</p>
                      <RadioGroup value={form.dataUsePurpose} onChange={(value) => setField('dataUsePurpose', value)}>
                        <Radio value="personalized_alerts">Alertas personalizados</Radio>
                        <Radio value="epidemiological_research">Pesquisa epidemiologica</Radio>
                        <Radio value="both">Ambos</Radio>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                      <Checkbox
                        isSelected={form.consentAccepted}
                        onChange={(isSelected) => setField('consentAccepted', isSelected)}
                      >
                        Li e concordo com a coleta dos meus dados de saude para as finalidades informadas.
                      </Checkbox>
                      <Checkbox
                        isSelected={form.anonymizationAccepted}
                        onChange={(isSelected) => setField('anonymizationAccepted', isSelected)}
                      >
                        Concordo com a anonimizacao dos dados quando eles forem cruzados com mapas e indicadores ambientais.
                      </Checkbox>
                    </div>

                    <Field label="Observacoes adicionais" hint="Campo opcional para contexto clinico, ocupacional ou ambiental relevante.">
                      <TextArea
                        aria-label="Observacoes adicionais"
                        fullWidth
                        minRows={4}
                        placeholder="Ex.: os sintomas pioram no fim da tarde, perto do trajeto ao trabalho..."
                        value={form.additionalNotes}
                        onChange={(event) => setField('additionalNotes', event.target.value)}
                      />
                    </Field>
                  </div>
                ) : null}

                {urgencyHint ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {urgencyHint}
                  </div>
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

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
                  <Button disabled={currentStep === 0 || isSubmitting || isPending} type="button" variant="secondary" onPress={previousStep}>
                    Voltar
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">
                      Etapa {currentStep + 1} de {STEPS.length}
                    </span>
                    {currentStep < STEPS.length - 1 ? (
                      <Button disabled={isSubmitting || isPending} type="button" onPress={nextStep}>
                        Continuar
                      </Button>
                    ) : (
                      <Button disabled={isSubmitting || isPending} type="submit">
                        {isSubmitting || isPending ? 'Enviando...' : 'Salvar triagem'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Card.Content>
          </Card>

          <div className="space-y-6">
            <Card className="border border-white/60 bg-white/90 shadow-lg shadow-slate-900/5">
              <Card.Header className="flex flex-col gap-2 px-6 pt-6">
                <Card.Title className="text-2xl font-semibold text-slate-900">Como usamos suas respostas</Card.Title>
                <Card.Description className="text-sm leading-6 text-slate-600">
                  O fluxo progressivo reduz abandono e permite cruzar sintomas com queimadas e qualidade do ar.
                </Card.Description>
              </Card.Header>
              <Card.Content className="space-y-3 px-6 pb-6 text-sm leading-6 text-slate-700">
                <p>1. Sintomas e localizacao vem primeiro para identificar rapido possiveis sinais de agravamento.</p>
                <p>2. Historico clinico melhora a classificacao de vulnerabilidade para criancas, idosos, gestantes e pessoas com comorbidades.</p>
                <p>3. Exposicao, ocupacao e medicacao ajudam a diferenciar crise ambiental de outros gatilhos.</p>
              </Card.Content>
            </Card>

            <Card className="border border-white/60 bg-white/90 shadow-lg shadow-slate-900/5">
              <Card.Header className="flex flex-col gap-2 px-6 pt-6">
                <Card.Title className="text-2xl font-semibold text-slate-900">Ultimas triagens</Card.Title>
                <Card.Description className="text-sm leading-6 text-slate-600">
                  Historico recente das suas submissoes autenticadas.
                </Card.Description>
              </Card.Header>
              <Card.Content className="space-y-3 px-6 pb-6">
                {recentAssessments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
                    Nenhuma triagem registrada ainda. Assim que voce enviar a primeira, ela aparecera aqui.
                  </div>
                ) : (
                  recentAssessments.map((assessment) => (
                    <article
                      key={assessment.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {assessment.city}
                            {assessment.state ? `, ${assessment.state}` : ''}
                          </p>
                          <p className="text-sm text-slate-600">
                            CEP {assessment.postal_code} - {assessment.neighborhood}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                          Risco {assessment.risk_level}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                        <span>{assessment.currently_symptomatic ? 'Com sintomas' : 'Sem sintomas'}</span>
                        <span>{assessment.symptom_severity || 'Sem classificacao de gravidade'}</span>
                        <span>{formatDate(assessment.created_at)}</span>
                      </div>
                    </article>
                  ))
                )}
              </Card.Content>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
