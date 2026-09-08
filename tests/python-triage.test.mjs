import test from "node:test";
import assert from "node:assert/strict";
import {
  kynistoTriageSymptoms,
  kynistoExtractSymptomEntities,
  getKynistoPythonStatus,
} from "../lib/kynisto-python.ts";

test("Python Engine Status & Telemetry", () => {
  const status = getKynistoPythonStatus();
  assert.equal(status.version, "2.1.0-python-triage");
  assert.equal(status.standard, "Emergency Severity Index (ESI 1-5)");
  assert.ok(status.specialtiesSupported >= 7);
  assert.ok(status.capabilities.length >= 4);
});

test("Python Triage - Emergency Level 1 (Cardiovascular / Respiratory Compromise)", () => {
  const complaint = "crushing chest pain radiating to left arm and severe breathlessness";
  const res = kynistoTriageSymptoms(complaint, 55, 2);

  assert.equal(res.esiLevel, 1);
  assert.equal(res.urgency, "EMERGENCY");
  assert.equal(res.queuePriority, 1);
  assert.equal(res.isEmergency, true);
  assert.equal(res.recommendedSpecialty, "Cardiology");
  assert.ok(res.redFlags.length > 0);
  assert.ok(res.guidanceInstructions.includes("IMMEDIATE EMERGENCY"));
});

test("Python Triage - Pediatric Vulnerability (Infant High Fever)", () => {
  const complaint = "baby has high fever and vomiting for 6 hours";
  // 6 month old infant (age = 0)
  const res = kynistoTriageSymptoms(complaint, 0, 6);

  assert.equal(res.urgency, "EMERGENCY");
  assert.equal(res.recommendedSpecialty, "Pediatrics");
  assert.ok(res.redFlags.some((rf) => rf.includes("Neonatal") || rf.includes("Infant")));
});

test("Python Triage - Urgent Level 3 (Orthopedic Joint Trauma)", () => {
  const complaint = "twisted ankle during football with severe swollen joint and fracture pain";
  const res = kynistoTriageSymptoms(complaint, 24, 4);

  assert.equal(res.esiLevel, 3);
  assert.equal(res.urgency, "URGENT");
  assert.equal(res.recommendedSpecialty, "Orthopedics");
  assert.equal(res.isEmergency, false);
  assert.ok(res.detectedSymptoms.some((s) => s.includes("ankle") || s.includes("joint") || s.includes("fracture")));
});

test("Python Triage - Dermatology & ENT Routing", () => {
  // Dermatology
  const skinRes = kynistoTriageSymptoms("red itchy skin rash with blisters on back", 30, 72);
  assert.equal(skinRes.recommendedSpecialty, "Dermatology");
  assert.equal(skinRes.urgency, "ROUTINE");

  // ENT
  const entRes = kynistoTriageSymptoms("sore throat with ear discharge and ringing in ear", 28, 48);
  assert.equal(entRes.recommendedSpecialty, "ENT (Ear, Nose & Throat)");
});

test("Python Triage - Routine Consultation Level 5", () => {
  const res = kynistoTriageSymptoms("routine diabetes checkup and blood pressure refill", 62);

  assert.equal(res.esiLevel, 5);
  assert.equal(res.urgency, "ROUTINE");
  assert.equal(res.recommendedSpecialty, "General Medicine");
  assert.equal(res.isEmergency, false);
});

test("Python Clinical NLP - Symptom Entity Extraction", () => {
  const text = "Patient reports persistent fever, coughing, acute headache, and toothache.";
  const entities = kynistoExtractSymptomEntities(text);

  assert.ok(entities.includes("fever"));
  assert.ok(entities.includes("cough"));
  assert.ok(entities.includes("headache"));
  assert.ok(entities.includes("toothache"));
});
