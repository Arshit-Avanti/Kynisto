# ==============================================================================
# 🐍 Kynisto Python Clinical NLP & Emergency Triage Engine
# Standardized Emergency Severity Index (ESI 1-5) Clinical Decision Support
# Extracts symptom entities, evaluates red-flag vitals, and routes to medical specialties.
# ==============================================================================

import re
import sys
import json
from typing import List, Dict, Any, Optional

# ESI Triage Urgency Tiers
TIER_EMERGENCY = "EMERGENCY" # ESI Level 1 & 2: Immediate / Emergent
TIER_URGENT    = "URGENT"    # ESI Level 3: Urgent, multiple resources needed
TIER_ROUTINE   = "ROUTINE"   # ESI Level 4 & 5: Less urgent / non-urgent

# Clinical Red-Flag Conditions that trigger immediate ESI 1 or 2
RED_FLAGS = [
    ("crushing chest pain", "Cardiovascular compromise / Acute Myocardial Infarction"),
    ("chest pain radiating to arm", "Suspected Acute Coronary Syndrome"),
    ("difficulty breathing", "Severe Respiratory Compromise"),
    ("breathlessness", "Acute Dyspnea"),
    ("stridor", "Upper airway obstruction"),
    ("anaphylaxis", "Severe allergic reaction with airway compromise"),
    ("unconscious", "Altered level of consciousness"),
    ("fainting with chest pain", "Cardiogenic syncope"),
    ("sudden facial droop", "Acute Stroke / CVA symptoms"),
    ("sudden weakness in arm", "Acute Neurological Deficit"),
    ("slurred speech", "Suspected Cerebrovascular Event"),
    ("coughing blood", "Hemoptysis / pulmonary emergency"),
    ("severe bleeding", "Hemorrhagic emergency"),
    ("fever above 104", "Hyperpyrexia with neuro risk"),
    ("infant high fever", "Pediatric neonatal emergency"),
    ("seizure", "Neurological emergency / Status epilepticus"),
    ("severe allergic reaction", "Anaphylactic risk"),
]

# Medical Specialty Clinical Taxonomy Matrix
SPECIALTY_TAXONOMY = {
    "Cardiology": [
        "chest pain", "heart", "palpitation", "angina", "irregular heartbeat",
        "tachycardia", "bradycardia", "cardiac", "hypertension", "bp high",
        "shortness of breath on lying flat", "ankle swelling", "edema"
    ],
    "Pediatrics": [
        "child", "baby", "infant", "toddler", "pediatric", "croup", "teething",
        "vaccination", "mumps", "measles", "chickenpox", "colic", "diaper rash",
        "child fever", "kids cough", "vomiting in child"
    ],
    "Orthopedics": [
        "bone", "joint", "fracture", "sprain", "dislocation", "ligament",
        "knee pain", "back pain", "spine", "arthritis", "swollen ankle",
        "wrist pain", "shoulder pain", "sciatica", "hip pain", "osteoporosis"
    ],
    "Dermatology": [
        "skin", "rash", "itch", "eczema", "acne", "psoriasis", "blister",
        "hives", "dandruff", "hair fall", "fungal", "ringworm", "pigmentation",
        "mole", "wart", "boil", "allergy on skin"
    ],
    "ENT (Ear, Nose & Throat)": [
        "ear", "nose", "throat", "tonsil", "hearing", "sinus", "vertigo",
        "ear discharge", "tinnitus", "ringing in ear", "nasal blockage",
        "sore throat", "hoarseness", "loss of voice", "earache"
    ],
    "Dentistry": [
        "tooth", "teeth", "dental", "gum", "jaw", "cavity", "root canal",
        "bleeding gums", "toothache", "wisdom tooth", "enamel", "mouth ulcer"
    ],
    "General Medicine": [
        "fever", "headache", "cold", "cough", "flu", "weakness", "body ache",
        "fatigue", "vomiting", "nausea", "diarrhea", "loose motions",
        "stomach pain", "indigestion", "acidity", "diabetes", "checkup",
        "infection", "viral", "malaise"
    ]
}

class KynistoTriageEngine:
    def __init__(self):
        # Pre-compile regex matchers for fast token extraction
        self.specialty_patterns = {
            spec: [re.compile(r'\b' + re.escape(term) + r'\b', re.IGNORECASE) for term in terms]
            for spec, terms in SPECIALTY_TAXONOMY.items()
        }
        self.red_flag_patterns = [
            (re.compile(r'\b' + re.escape(pattern) + r'\b', re.IGNORECASE), desc)
            for pattern, desc in RED_FLAGS
        ]

    def evaluate_triage(self, complaint: str, age: Optional[int] = None, duration_hours: Optional[int] = None) -> Dict[str, Any]:
        """
        Evaluates patient symptoms and assigns Emergency Severity Index (ESI)
        along with doctor specialty routing and clinical guidance.
        """
        complaint_lower = complaint.lower().strip()
        detected_red_flags = []

        # 1. Red-Flag Emergency Screening (ESI Level 1 or 2)
        for pattern, description in self.red_flag_patterns:
            if pattern.search(complaint_lower):
                detected_red_flags.append(description)

        # Pediatric vulnerability modifier: fever in infant < 6 months is high risk
        if age is not None and age <= 1 and ("fever" in complaint_lower or "vomiting" in complaint_lower):
            detected_red_flags.append("Neonatal/Infant Acute Distress (High Vulnerability Age)")

        # 2. Specialty Matching & Symptom Extraction
        detected_symptoms = []
        specialty_scores: Dict[str, int] = {spec: 0 for spec in SPECIALTY_TAXONOMY}

        for spec, patterns in self.specialty_patterns.items():
            for p in patterns:
                match = p.search(complaint_lower)
                if match:
                    detected_symptoms.append(match.group(0))
                    specialty_scores[spec] += 2

        # Pediatric age override: If patient is <= 14 years old, route to Pediatrics if general symptoms
        if age is not None and age <= 14:
            specialty_scores["Pediatrics"] += 4

        # Select highest scoring specialty
        best_specialty = max(specialty_scores, key=specialty_scores.get)
        if specialty_scores[best_specialty] == 0:
            best_specialty = "General Medicine"

        # 3. Emergency Severity Index (ESI) Calculation
        if len(detected_red_flags) > 0:
            if any("Resuscitation" in rf or "Cardiac" in rf or "Airway" in rf or "Stroke" in rf for rf in detected_red_flags):
                esi_level = 1
                urgency = TIER_EMERGENCY
                queue_priority = 1
                guidance = "IMMEDIATE EMERGENCY: Severe vital compromise detected. Proceed immediately to Emergency/ICU or nearest hospital emergency room."
            else:
                esi_level = 2
                urgency = TIER_EMERGENCY
                queue_priority = 1
                guidance = "HIGH PRIORITY / EMERGENT: Clinical evaluation required within 15 minutes. Please notify triage staff upon arrival."
        else:
            is_routine = ("routine" in complaint_lower or "checkup" in complaint_lower or "refill" in complaint_lower) and \
                not any(k in complaint_lower for k in ("severe", "pain", "fever"))
            is_severe = any(k in complaint_lower for k in ("severe", "high fever", "sharp", "unbearable", "acute"))
            is_acute = (duration_hours is not None and duration_hours < 24 and is_severe)

            if is_routine:
                esi_level = 5
                urgency = TIER_ROUTINE
                queue_priority = 3
                guidance = "GENERAL CHECKUP: Routine clinical consultation and preventive evaluation."
            elif is_severe or is_acute:
                esi_level = 3
                urgency = TIER_URGENT
                queue_priority = 2
                guidance = "URGENT OPD: Acute symptoms detected. Prioritized in queue for fast evaluation by the attending physician."
            elif len(detected_symptoms) > 0:
                esi_level = 4
                urgency = TIER_ROUTINE
                queue_priority = 3
                guidance = "ROUTINE CONSULTATION: Standard outpatient visit. Please take your token and wait for your turn."
            else:
                esi_level = 5
                urgency = TIER_ROUTINE
                queue_priority = 3
                guidance = "GENERAL CHECKUP: General clinical consultation and preventive evaluation."

        return {
            "esiLevel": esi_level,
            "urgency": urgency,
            "queuePriority": queue_priority,
            "recommendedSpecialty": best_specialty,
            "primaryDepartment": best_specialty.split()[0],
            "detectedSymptoms": list(set(detected_symptoms)),
            "redFlags": detected_redFlags := detected_red_flags,
            "guidanceInstructions": guidance,
            "isEmergency": len(detected_red_flags) > 0,
            "algorithm": "Kynisto Clinical NLP & ESI Triage v2.1 (Python Engine)"
        }

# Global singleton
_engine = KynistoTriageEngine()

def triage_symptoms(complaint: str, age: Optional[int] = None, duration_hours: Optional[int] = None) -> Dict[str, Any]:
    return _engine.evaluate_triage(complaint, age, duration_hours)

if __name__ == "__main__":
    test_cases = [
        "5-year-old child with sudden high fever, cough, and earache",
        "crushing chest pain radiating to left arm with difficulty breathing",
        "twisted ankle during basketball game, swollen joint with sharp pain",
        "red itchy rash with blisters on forearms for 3 days",
        "routine diabetes checkup and blood pressure refill"
    ]
    print("=== 🐍 Kynisto Python Clinical Triage Engine Test Run ===")
    for text in test_cases:
        res = triage_symptoms(text)
        print(f"\nComplaint: {text}")
        print(f"-> ESI Level: {res['esiLevel']} | Urgency: {res['urgency']} | Specialty: {res['recommendedSpecialty']}")
        print(f"-> Guidance: {res['guidanceInstructions']}")
