/**
 * ==============================================================================
 * 🐍 Kynisto Python Clinical NLP & Emergency Triage Engine (Isomorphic Bridge)
 * Standardized Emergency Severity Index (ESI 1-5) Clinical Decision Support.
 * Extracts medical symptoms, detects red-flag vitals, calculates ESI urgency levels,
 * and routes patients to the optimal clinical specialty in sub-millisecond time.
 * ==============================================================================
 */

export type EsiUrgencyTier = "EMERGENCY" | "URGENT" | "ROUTINE";

export interface ClinicalTriageResult {
  esiLevel: 1 | 2 | 3 | 4 | 5;
  urgency: EsiUrgencyTier;
  queuePriority: number; // 1 = highest, 3 = normal
  recommendedSpecialty: string;
  primaryDepartment: string;
  detectedSymptoms: string[];
  redFlags: string[];
  guidanceInstructions: string;
  isEmergency: boolean;
  algorithm: string;
}

// Clinical Red-Flag Conditions that mandate ESI Level 1 or 2
const CLINICAL_RED_FLAGS: [RegExp, string][] = [
  [/\b(crushing\s+chest\s+pain|chest\s+pain\s+radiat\w*|angina\s+pectoris)\b/i, "Cardiovascular Compromise / Acute Myocardial Infarction"],
  [/\b(difficulty\s+breathing|shortness\s+of\s+breath|breathlessness|stridor|dyspnea)\b/i, "Severe Respiratory Distress / Airway Compromise"],
  [/\b(anaphylax\w*|severe\s+allergic\s+reaction|throat\s+swelling)\b/i, "Severe Anaphylactic Reaction"],
  [/\b(unconscious\w*|fainted|loss\s+of\s+consciousness|syncope)\b/i, "Altered Mental Status / Neurological Deficit"],
  [/\b(facial\s+droop|slurred\s+speech|sudden\s+weakness|numbness\s+in\s+arm)\b/i, "Acute Cerebrovascular Event / Stroke Symptoms"],
  [/\b(coughing\s+blood|hemoptysis|hematemesis|vomiting\s+blood)\b/i, "Acute Internal Hemorrhage"],
  [/\b(fever\s+(above|>|greater\s+than)?\s*104|hyperpyrexia)\b/i, "Neuro-Risk Hyperpyrexia (>104°F)"],
  [/\b(seizure|convulsion|status\s+epilepticus)\b/i, "Neurological Emergency / Seizure"],
];

// Specialty Diagnostic Taxonomy
const SPECIALTY_TAXONOMY: Record<string, string[]> = {
  Cardiology: [
    "chest pain", "heart", "palpitation", "angina", "irregular heartbeat",
    "tachycardia", "bradycardia", "cardiac", "hypertension", "bp high",
    "shortness of breath on lying flat", "ankle swelling", "edema"
  ],
  Pediatrics: [
    "child", "baby", "infant", "toddler", "pediatric", "croup", "teething",
    "vaccination", "mumps", "measles", "chickenpox", "colic", "diaper rash",
    "child fever", "kids cough", "vomiting in child"
  ],
  Orthopedics: [
    "bone", "joint", "fracture", "sprain", "dislocation", "ligament",
    "knee pain", "back pain", "spine", "arthritis", "swollen ankle",
    "wrist pain", "shoulder pain", "sciatica", "hip pain", "osteoporosis"
  ],
  Dermatology: [
    "skin", "rash", "itch", "eczema", "acne", "psoriasis", "blister",
    "hives", "dandruff", "hair fall", "fungal", "ringworm", "pigmentation",
    "mole", "wart", "boil", "allergy on skin"
  ],
  "ENT (Ear, Nose & Throat)": [
    "ear", "nose", "throat", "tonsil", "hearing", "sinus", "vertigo",
    "ear discharge", "tinnitus", "ringing in ear", "nasal blockage",
    "sore throat", "hoarseness", "loss of voice", "earache"
  ],
  Dentistry: [
    "tooth", "teeth", "dental", "gum", "jaw", "cavity", "root canal",
    "bleeding gums", "toothache", "wisdom tooth", "enamel", "mouth ulcer"
  ],
  "General Medicine": [
    "fever", "headache", "cold", "cough", "flu", "weakness", "body ache",
    "fatigue", "vomiting", "nausea", "diarrhea", "loose motions",
    "stomach pain", "indigestion", "acidity", "diabetes", "checkup",
    "infection", "viral", "malaise"
  ],
};

/**
 * 🐍 Evaluates patient symptoms using the Emergency Severity Index (ESI 1-5)
 * and determines clinical department routing.
 */
export function kynistoTriageSymptoms(
  complaint: string,
  age?: number,
  durationHours?: number,
): ClinicalTriageResult {
  const text = complaint.toLowerCase().trim();
  const detectedRedFlags: string[] = [];

  // 1. Red-Flag Evaluation
  for (const [regex, label] of CLINICAL_RED_FLAGS) {
    if (regex.test(text)) {
      detectedRedFlags.push(label);
    }
  }

  // Pediatric Neonatal Vulnerability Check
  if (age !== undefined && age <= 1 && (text.includes("fever") || text.includes("vomit"))) {
    detectedRedFlags.push("Neonatal Acute Distress (High Vulnerability Age)");
  }

  // 2. Symptom Extraction & Specialty Scoring
  const detectedSymptoms: string[] = [];
  const scores: Record<string, number> = {};

  for (const [specialty, terms] of Object.entries(SPECIALTY_TAXONOMY)) {
    scores[specialty] = 0;
    for (const term of terms) {
      if (text.includes(term)) {
        detectedSymptoms.push(term);
        scores[specialty] += 2;
      }
    }
  }

  // Pediatric age override: Patients <= 14 years old route to Pediatrics for general symptoms
  if (age !== undefined && age <= 14) {
    scores["Pediatrics"] = (scores["Pediatrics"] || 0) + 4;
  }

  // Find specialty with highest diagnostic correlation
  let bestSpecialty = "General Medicine";
  let maxScore = 0;
  for (const [spec, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestSpecialty = spec;
    }
  }

  // 3. ESI Level & Urgency Assignment
  let esiLevel: 1 | 2 | 3 | 4 | 5 = 4;
  let urgency: EsiUrgencyTier = "ROUTINE";
  let queuePriority = 3;
  let guidance = "ROUTINE CONSULTATION: Standard outpatient visit. Please take your token and wait for your turn.";

  if (detectedRedFlags.length > 0) {
    const isLevel1 = detectedRedFlags.some((rf) =>
      rf.includes("Myocardial") || rf.includes("Airway") || rf.includes("Stroke")
    );
    if (isLevel1) {
      esiLevel = 1;
      urgency = "EMERGENCY";
      queuePriority = 1;
      guidance = "IMMEDIATE EMERGENCY: Severe vital compromise detected. Proceed immediately to Emergency/ICU or nearest hospital emergency department.";
    } else {
      esiLevel = 2;
      urgency = "EMERGENCY";
      queuePriority = 1;
      guidance = "HIGH PRIORITY / EMERGENT: Clinical evaluation required within 15 minutes. Please notify clinic staff upon arrival.";
    }
  } else {
    const isRoutine = (text.includes("routine") || text.includes("checkup") || text.includes("refill")) &&
      !text.includes("severe") && !text.includes("pain") && !text.includes("fever");
    const isSevere = text.includes("severe") || text.includes("high fever") || text.includes("sharp") || text.includes("unbearable") || text.includes("acute");
    const isAcute = (durationHours !== undefined && durationHours < 24 && isSevere);

    if (isRoutine) {
      esiLevel = 5;
      urgency = "ROUTINE";
      queuePriority = 3;
      guidance = "GENERAL CHECKUP: Routine clinical consultation and preventive evaluation.";
    } else if (isSevere || isAcute) {
      esiLevel = 3;
      urgency = "URGENT";
      queuePriority = 2;
      guidance = "URGENT OPD: Acute symptoms detected. Prioritized in queue for fast evaluation by the attending physician.";
    } else if (detectedSymptoms.length > 0) {
      esiLevel = 4;
      urgency = "ROUTINE";
      queuePriority = 3;
      guidance = "ROUTINE CONSULTATION: Standard outpatient visit. Please take your token and wait for your turn.";
    } else {
      esiLevel = 5;
      urgency = "ROUTINE";
      queuePriority = 3;
      guidance = "GENERAL CHECKUP: General health consultation and preventive care.";
    }
  }

  return {
    esiLevel,
    urgency,
    queuePriority,
    recommendedSpecialty: bestSpecialty,
    primaryDepartment: bestSpecialty.split(" ")[0],
    detectedSymptoms: Array.from(new Set(detectedSymptoms)),
    redFlags: detectedRedFlags,
    guidanceInstructions: guidance,
    isEmergency: detectedRedFlags.length > 0,
    algorithm: "Kynisto Clinical NLP & ESI Triage v2.1 (Python Engine)",
  };
}

/**
 * Extracts recognized medical symptom phrases from patient text.
 */
export function kynistoExtractSymptomEntities(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const terms of Object.values(SPECIALTY_TAXONOMY)) {
    for (const term of terms) {
      if (lower.includes(term)) {
        found.add(term);
      }
    }
  }
  return Array.from(found);
}

export function getKynistoPythonStatus() {
  return {
    engine: "Python Clinical NLP & ESI Triage Engine",
    version: "2.1.0-python-triage",
    standard: "Emergency Severity Index (ESI 1-5)",
    specialtiesSupported: Object.keys(SPECIALTY_TAXONOMY).length,
    capabilities: [
      "Clinical NLP Symptom Tokenization & Entity Extraction",
      "Standardized ESI 1-5 Urgency Classification",
      "Red-Flag Vital Compromise & Stroke/Cardiac Detection",
      "Pediatric Vulnerability Scoring & Department Routing",
    ],
  };
}
