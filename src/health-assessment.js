import { createHealthAssessment } from './db.js';

const PREGNANCY_STATUSES = new Set(['yes', 'no', 'not_applicable']);
const SEVERITY_LEVELS = new Set(['leve', 'moderada', 'grave']);
const DATA_USE_PURPOSES = new Set(['personalized_alerts', 'epidemiological_research', 'both']);
const RISK_LABELS = {
  low: 'baixo',
  medium: 'moderado',
  high: 'alto'
};

const ALLOWED_DIAGNOSES = new Set([
  'asthma',
  'bronchitis',
  'copd',
  'rhinitis',
  'sinusitis',
  'frequent_pneumonia',
  'srag_history',
  'cardiovascular_disease',
  'hypertension'
]);

const ALLOWED_RESPIRATORY_SYMPTOMS = new Set([
  'dry_cough',
  'productive_cough',
  'shortness_of_breath',
  'wheezing',
  'chest_pain',
  'rapid_breathing'
]);

const ALLOWED_MUCOSAL_SYMPTOMS = new Set([
  'eye_irritation',
  'eye_redness',
  'runny_nose',
  'nasal_obstruction',
  'sore_throat'
]);

const ALLOWED_SYSTEMIC_SYMPTOMS = new Set(['headache', 'dizziness', 'fatigue']);

const ALLOWED_OCCUPATIONAL_EXPOSURES = new Set([
  'outdoor_work',
  'rural_burn_area',
  'dust',
  'chemicals',
  'none'
]);

const ALLOWED_HOUSEHOLD_EXPOSURES = new Set([
  'wood_stove',
  'mold',
  'dust',
  'air_conditioning',
  'indoor_smokers',
  'none'
]);

const ALLOWED_CONTINUOUS_MEDICATIONS = new Set([
  'inhaled_corticosteroids',
  'bronchodilators',
  'antihistamines',
  'oxygen_therapy',
  'other'
]);

const ALLOWED_RECENT_CARE_SERVICES = new Set([
  'none',
  'primary_care',
  'vigiar_unit',
  'upa',
  'hospital',
  'telehealth'
]);

const ALLOWED_SMOKE_PERCEPTION = new Set(['none', 'smell', 'dry_haze', 'nearby_fire']);
const ALLOWED_OUTDOOR_ACTIVITY = new Set(['rarely', '1_2_days', '3_5_days', 'daily']);
const ALLOWED_SMOKING_STATUS = new Set(['never', 'active', 'former', 'passive']);

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanOptionalString(value) {
  const normalized = cleanString(value);
  return normalized || null;
}

function sanitizeArray(values, allowedValues) {
  if (!Array.isArray(values)) {
    return [];
  }

  const uniqueValues = new Set();
  for (const value of values) {
    if (typeof value === 'string' && allowedValues.has(value)) {
      uniqueValues.add(value);
    }
  }

  if (uniqueValues.has('none') && uniqueValues.size > 1) {
    uniqueValues.delete('none');
  }

  return Array.from(uniqueValues);
}

function parseInteger(value, { min = null, max = null } = {}) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  if ((min !== null && parsed < min) || (max !== null && parsed > max)) {
    return null;
  }

  return parsed;
}

function parseDate(value) {
  const normalized = cleanString(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return normalized;
}

function parseDateTime(value) {
  const normalized = cleanString(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function computeAgeFromBirthDate(birthDate) {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00Z`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = today.getUTCDate() - birth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function buildRiskLevel({ age, pregnancyStatus, diagnoses, symptomSeverity, symptomIntensity, careHistory, respiratorySymptoms }) {
  const hasHighRiskDiagnosis =
    diagnoses.includes('copd') ||
    diagnoses.includes('cardiovascular_disease') ||
    diagnoses.includes('hypertension') ||
    diagnoses.includes('srag_history');

  const hasVulnerability = age !== null && (age < 5 || age >= 60);
  const needsUrgentCare =
    symptomSeverity === 'grave' ||
    symptomIntensity >= 5 ||
    careHistory.recentCareServices.includes('hospital') ||
    careHistory.recentCareServices.includes('upa');
  const hasBreathingAlarm =
    respiratorySymptoms.includes('shortness_of_breath') ||
    respiratorySymptoms.includes('rapid_breathing') ||
    respiratorySymptoms.includes('chest_pain');

  if (needsUrgentCare || (hasHighRiskDiagnosis && hasBreathingAlarm)) {
    return RISK_LABELS.high;
  }

  if (
    symptomSeverity === 'moderada' ||
    symptomIntensity >= 3 ||
    hasHighRiskDiagnosis ||
    hasVulnerability ||
    pregnancyStatus === 'yes'
  ) {
    return RISK_LABELS.medium;
  }

  return RISK_LABELS.low;
}

export function validateHealthAssessmentPayload(payload) {
  const birthDate = parseDate(payload.birthDate);
  const ageFromInput = parseInteger(payload.age, { min: 0, max: 120 });
  const age = ageFromInput ?? computeAgeFromBirthDate(birthDate);
  const pregnancyStatus = cleanString(payload.pregnancyStatus);
  const postalCode = cleanString(payload.postalCode);
  const neighborhood = cleanString(payload.neighborhood);
  const city = cleanString(payload.city);
  const state = cleanOptionalString(payload.state);
  const currentlySymptomatic = payload.currentlySymptomatic !== false;
  const symptomStartedAt = parseDateTime(payload.symptomStartedAt);
  const symptomIntensity = parseInteger(payload.symptomIntensity, { min: 1, max: 5 });
  const symptomSeverity = cleanString(payload.symptomSeverity);
  const diagnoses = sanitizeArray(payload.diagnoses, ALLOWED_DIAGNOSES);
  const respiratorySymptoms = sanitizeArray(payload.respiratorySymptoms, ALLOWED_RESPIRATORY_SYMPTOMS);
  const mucosalSymptoms = sanitizeArray(payload.mucosalSymptoms, ALLOWED_MUCOSAL_SYMPTOMS);
  const systemicSymptoms = sanitizeArray(payload.systemicSymptoms, ALLOWED_SYSTEMIC_SYMPTOMS);
  const occupationalExposures = sanitizeArray(payload.occupationalExposures, ALLOWED_OCCUPATIONAL_EXPOSURES);
  const householdExposures = sanitizeArray(payload.householdExposures, ALLOWED_HOUSEHOLD_EXPOSURES);
  const continuousMedications = sanitizeArray(payload.continuousMedications, ALLOWED_CONTINUOUS_MEDICATIONS);
  const recentCareServices = sanitizeArray(payload.recentCareServices, ALLOWED_RECENT_CARE_SERVICES);
  const smokePerception = cleanString(payload.smokePerception);
  const outdoorActivityFrequency = cleanString(payload.outdoorActivityFrequency);
  const outdoorMinutesPerDay = parseInteger(payload.outdoorMinutesPerDay, { min: 0, max: 1440 });
  const smokingStatus = cleanString(payload.smokingStatus);
  const rescueMedication24h = parseInteger(payload.rescueMedication24h, { min: 0, max: 99 }) ?? 0;
  const rescueMedicationWeek = parseInteger(payload.rescueMedicationWeek, { min: 0, max: 999 }) ?? 0;
  const hospitalizedLastYear = Boolean(payload.hospitalizedLastYear);
  const consentAccepted = payload.consentAccepted === true;
  const anonymizationAccepted = payload.anonymizationAccepted === true;
  const dataUsePurpose = cleanString(payload.dataUsePurpose);
  const additionalNotes = cleanOptionalString(payload.additionalNotes);

  if (!birthDate && age === null) {
    return { ok: false, message: 'Informe a idade ou a data de nascimento.' };
  }

  if (!PREGNANCY_STATUSES.has(pregnancyStatus)) {
    return { ok: false, message: 'Informe a situacao gestacional.' };
  }

  if (!postalCode || !neighborhood || !city) {
    return { ok: false, message: 'Preencha CEP, bairro e municipio para o georreferenciamento.' };
  }

  if (!ALLOWED_SMOKE_PERCEPTION.has(smokePerception)) {
    return { ok: false, message: 'Informe como voce percebe a fumaca ou a poluicao na sua regiao.' };
  }

  if (!ALLOWED_OUTDOOR_ACTIVITY.has(outdoorActivityFrequency)) {
    return { ok: false, message: 'Informe a frequencia das atividades ao ar livre.' };
  }

  if (!ALLOWED_SMOKING_STATUS.has(smokingStatus)) {
    return { ok: false, message: 'Informe o historico de tabagismo.' };
  }

  if (!DATA_USE_PURPOSES.has(dataUsePurpose)) {
    return { ok: false, message: 'Selecione a finalidade principal do uso dos dados.' };
  }

  if (!consentAccepted || !anonymizationAccepted) {
    return {
      ok: false,
      message: 'Voce precisa aceitar o termo de consentimento e a anonimizacao para enviar o formulario.'
    };
  }

  const normalizedRespiratorySymptoms = currentlySymptomatic ? respiratorySymptoms : [];
  const normalizedMucosalSymptoms = currentlySymptomatic ? mucosalSymptoms : [];
  const normalizedSystemicSymptoms = currentlySymptomatic ? systemicSymptoms : [];
  const normalizedSymptomStartedAt = currentlySymptomatic ? symptomStartedAt : null;
  const normalizedSymptomIntensity = currentlySymptomatic ? symptomIntensity : null;
  const normalizedSymptomSeverity = currentlySymptomatic ? symptomSeverity : null;

  if (currentlySymptomatic) {
    const symptomCount =
      normalizedRespiratorySymptoms.length + normalizedMucosalSymptoms.length + normalizedSystemicSymptoms.length;
    if (symptomCount === 0) {
      return { ok: false, message: 'Selecione ao menos um sintoma atual ou indique que nao ha sintomas.' };
    }

    if (!normalizedSymptomStartedAt) {
      return { ok: false, message: 'Informe a data e hora de inicio dos sintomas.' };
    }

    if (!normalizedSymptomIntensity || !SEVERITY_LEVELS.has(normalizedSymptomSeverity)) {
      return { ok: false, message: 'Informe a intensidade e a classificacao da gravidade dos sintomas.' };
    }
  }

  const exposureProfile = {
    smokePerception,
    outdoorActivityFrequency,
    outdoorMinutesPerDay: outdoorMinutesPerDay ?? 0,
    occupationalExposures,
    householdExposures,
    smokingStatus
  };

  const medicationProfile = {
    continuousMedications,
    rescueMedication24h,
    rescueMedicationWeek
  };

  const careHistory = {
    recentCareServices,
    hospitalizedLastYear
  };

  const riskLevel = buildRiskLevel({
    age,
    pregnancyStatus,
    diagnoses,
    symptomSeverity: normalizedSymptomSeverity,
    symptomIntensity: normalizedSymptomIntensity ?? 1,
    careHistory,
    respiratorySymptoms: normalizedRespiratorySymptoms
  });

  return {
    ok: true,
    value: {
      birthDate,
      age,
      pregnancyStatus,
      postalCode,
      neighborhood,
      city,
      state,
      currentlySymptomatic,
      symptomStartedAt: normalizedSymptomStartedAt,
      symptomIntensity: normalizedSymptomIntensity,
      symptomSeverity: normalizedSymptomSeverity,
      diagnoses,
      respiratorySymptoms: normalizedRespiratorySymptoms,
      mucosalSymptoms: normalizedMucosalSymptoms,
      systemicSymptoms: normalizedSystemicSymptoms,
      exposureProfile,
      medicationProfile,
      careHistory,
      additionalNotes,
      consentAccepted,
      anonymizationAccepted,
      dataUsePurpose,
      riskLevel
    }
  };
}

export async function saveHealthAssessment(userId, payload) {
  return createHealthAssessment({
    userId,
    ...payload
  });
}
